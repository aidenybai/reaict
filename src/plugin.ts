import type { PluginItem, PluginObj } from '@babel/core';
import { parse, traverse } from '@babel/core';
import generate from '@babel/generator';
import { declare } from '@babel/helper-plugin-utils';
import pluginSyntaxJsx from '@babel/plugin-syntax-jsx';
import pluginSyntaxTypescript from '@babel/plugin-syntax-typescript';
import * as t from '@babel/types';
import dedent from 'dedent';
import OpenAI from 'openai';
import { createUnplugin } from 'unplugin';
import { isCapitalized } from './utils';
import { addDefault, addNamed } from '@babel/helper-module-imports';

export interface Options {
  apiKey: string;
  openai?: OpenAI;
  plugins?: PluginItem[];
  deferred?: (() => Promise<string | null>)[];
  generatorCode?: { filename: string };
}

export const unplugin = createUnplugin((options: Options) => {
  if (!options.apiKey) {
    throw new Error('Missing OpenAI API key.');
  }

  const openai = new OpenAI({
    apiKey: options.apiKey,
  });

  return {
    enforce: 'pre',
    name: 'reaict',
    transformInclude(id: string) {
      return /\.[jt]sx$/.test(id);
    },
    async transform(code: string, id: string) {
      const plugins: PluginItem[] = [[pluginSyntaxJsx]];

      const isTSX = id.endsWith('.tsx');
      if (isTSX) {
        plugins.push([
          pluginSyntaxTypescript,
          { allExtensions: true, isTSX: true },
        ]);
      }
      const todo: (() => Promise<{ prev: string } | null>)[] = [];

      const ast = parse(code, {
        plugins,
        filename: id,
      });

      if (!ast) return null;

      const visitor = {
        FunctionDeclaration(path) {
          if (!isCapitalized(path.node.id?.name)) return;

          const returnsJSX = path.node.body.body.some((node) => {
            if (t.isReturnStatement(node)) {
              return (
                t.isJSXElement(node.argument) || t.isJSXFragment(node.argument)
              );
            }
            return false;
          });

          if (!returnsJSX) return;

          const code = generate(path.node).code;
          const optimize = async () => {
            const completion = await openai!.chat.completions.create({
              messages: [
                {
                  role: 'user',
                  content: dedent`
                This is a React component, optimize it with React.useMemo, React.useCallback. you must prepend hooks with "React.". Do not optimize identifiers. Try to pre-evaluate expressions. Only return the new component function declaration in plaintext. Do not include the imports or exports:\n\n${code}`,
                },
              ],
              model: 'gpt-4',
            });
            const content = completion.choices[0]?.message.content;
            if (!content) return null;

            // validate function declaration
            const ast = parse(content, {
              plugins,
            });
            const functionDeclaration = ast?.program.body[0];
            if (!t.isFunctionDeclaration(functionDeclaration))
              return await optimize();

            path.replaceWith(functionDeclaration);
            addDefault(path, 'react', { nameHint: 'React' });
          };
          todo!.push(optimize);
        },
      };

      traverse(ast, visitor);

      await Promise.all(
        todo.map((deferred) => {
          return deferred();
        }),
      );

      return generate(ast).code ?? null;
    },
  };
});

export const normalizePlugins = (
  plugins: (PluginItem | false | undefined | null)[],
) => {
  return plugins.filter((plugin) => plugin) as PluginItem[];
};
