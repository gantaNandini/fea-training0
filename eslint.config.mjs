import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

// REQ-320: runtime `@prisma/client` imports are only allowed in the data-access layer
// and a short list of explicit exceptions. `import type` is allowed everywhere.
const prismaAllowList = [
  'src/lib/data/**',
  'src/lib/db/index.ts',
  'src/lib/orders/complete-order.ts',
  'src/lib/rate-limit/postgres.ts',
  'src/lib/auth/auth.ts',
  'src/lib/admin/queries.ts',
  'prisma/seed.ts',
  'tests/**',
]

const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**', 'playwright-report/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@prisma/client',
              allowTypeImports: true,
              message:
                'Import Prisma only through src/lib/data/* (REQ-320). `import type` is allowed anywhere.',
            },
          ],
        },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: prismaAllowList,
    rules: { '@typescript-eslint/no-restricted-imports': 'off' },
  },
]

export default eslintConfig
