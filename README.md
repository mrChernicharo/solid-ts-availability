-   pnpm i @solid-primitives/pointer
-   pnpm install -D tailwindcss postcss autoprefixer
-   npx tailwindcss init -p

// tailwind.config.js

```
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {},
	},
	plugins: [],
};
```

// index.css

```
@tailwind base;
@tailwind components;
@tailwind utilities;
```
