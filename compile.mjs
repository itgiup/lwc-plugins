import { dirname, resolve } from 'node:path';
import { copyFileSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { build, defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { generateDtsBundle } from 'dts-bundle-generator';

function buildPackageJson(packageName, rootPkg) {
	/*
	 Define the contents of the package's package.json here.
	 */
	return {
		name: packageName,
		version: rootPkg.version,
		license: rootPkg.license,
		author: rootPkg.author,
		description: rootPkg.description,
		keywords: ['lwc-plugin', 'lightweight-charts'],
		type: 'module',
		main: `./${packageName}.umd.cjs`,
		module: `./${packageName}.js`,
		types: `./${packageName}.d.ts`,
		exports: {
			import: {
				types: `./${packageName}.d.ts`,
				default: `./${packageName}.js`,
			},
			require: {
				types: `./${packageName}.d.cts`,
				default: `./${packageName}.umd.cjs`,
			},
		},
	};
}

const __filename = fileURLToPath(import.meta.url);
const currentDir = dirname(__filename);

const rootPackageJsonPath = resolve(currentDir, 'package.json');
const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, 'utf-8'));

const pluginsToBuild = [
	{
		filepath: resolve(currentDir, 'src', 'index.ts'), // Use the new index.ts as the main entry
		exportName: 'itgiup-lwc-plugins', // Keep the package name
		name: 'ItgiuplwcpluginsBundle', // A suitable name for the UMD global if needed
	},
];

const compiledFolder = resolve(currentDir, 'dist');
if (!existsSync(compiledFolder)) {
	mkdirSync(compiledFolder);
}

const buildConfig = ({
	filepath,
	name,
	exportName,
	formats = ['es', 'umd'],
}) => {
	return defineConfig({
		publicDir: false,
		build: {
			outDir: `dist`,
			emptyOutDir: true,
			copyPublicDir: false,
			lib: {
				entry: filepath,
				name,
				formats,
				fileName: exportName,
			},
			rollupOptions: {
				external: ['lightweight-charts', 'fancy-canvas'],
				output: {
					globals: {
						'lightweight-charts': 'LightweightCharts',
					},
				},
			},
		},
	});
};

const startTime = Date.now().valueOf();
console.log('⚡️ Starting');
console.log('Bundling the plugin...');
const promises = pluginsToBuild.map(file => {
	return build(buildConfig(file));
});
await Promise.all(promises);
console.log('Generating the package.json file...');
pluginsToBuild.forEach(file => {
	const packagePath = resolve(compiledFolder, 'package.json');
	const content = JSON.stringify(
		buildPackageJson(file.exportName, rootPackageJson),
		undefined,
		4
	);
	writeFileSync(packagePath, content, { encoding: 'utf-8' });
});
console.log('Generating the typings files...');
pluginsToBuild.forEach(file => {
	try {
		const esModuleTyping = generateDtsBundle([
			{
				filePath: `./typings/${pluginFileName}.d.ts`,
			},
		]);
		const typingFilePath = resolve(compiledFolder, `${file.exportName}.d.ts`);
		writeFileSync(typingFilePath, esModuleTyping.join('\n'), {
			encoding: 'utf-8',
		});
		copyFileSync(typingFilePath, resolve(compiledFolder, `${file.exportName}.d.cts`));
	} catch (e) {
		console.error('Error generating typings for: ', file.exportName);
	}
});

// Copy src/README.md to dist/README.md
const readmeSrcPath = resolve(currentDir, 'src', 'README.md');
const readmeDestPath = resolve(compiledFolder, 'README.md');
if (existsSync(readmeSrcPath)) {
    copyFileSync(readmeSrcPath, readmeDestPath);
    console.log('Copied src/README.md to dist/README.md');
} else {
    console.warn('src/README.md not found, skipping copy.');
}

const endTime = Date.now().valueOf();
console.log(`🎉 Done (${endTime - startTime}ms)`);
