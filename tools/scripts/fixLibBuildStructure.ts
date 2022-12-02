import chalk from "chalk"
import path from "path"
import fs from "fs-extra"

const invariant = (condition, message) => {
	if (!condition) {
		console.error(chalk.bold.red(message))
		process.exit(1)
	}
}

const start = async () => {
	const [, , name] = process.argv
	invariant(!!name, "Missing required parameter [name]")
	console.log(`Correcting build structure for ${name}`)

	const tmpPath = path.resolve(__dirname, "../..", "tmp/libs/", name)
	const outputPath = path.resolve(__dirname, "../..", "dist/libs/", name)
	const src = path.join(outputPath, "src")
	invariant(fs.existsSync(outputPath), "Output directory does not exist. Did you forget to build first?")

	if (fs.pathExistsSync(tmpPath)) {
		fs.removeSync(tmpPath)
	}
	fs.ensureDirSync(tmpPath)
	fs.cpSync(src, tmpPath, { recursive: true })
	fs.removeSync(src)
	fs.cpSync(outputPath, tmpPath, { recursive: true })

	const packageJsonPath = path.join(tmpPath, "package.json")
	invariant(fs.existsSync(packageJsonPath), `No package.json found at expected path "${packageJsonPath}"`)
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))

	// remove useless exports
	delete packageJson["exports"]

	packageJson.main = "./index.js"
	packageJson.typings = "./index.d.ts"
	fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

	fs.removeSync(outputPath)
	fs.ensureDirSync(outputPath)
	fs.cpSync(tmpPath, outputPath, { recursive: true })
	fs.removeSync(tmpPath)

	process.exit(0)
}

start().catch((error) => {
	console.error(error?.message)
	console.error(error?.stack)
	process.exit(1)
})
