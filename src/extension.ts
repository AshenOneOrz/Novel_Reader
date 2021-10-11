import * as vscode from 'vscode'
import * as fs from 'fs'

const log = console.log.bind(console)

const readFile = (path: string): string => {
    log('path is ', path)
    let data:string = ''
    try {
        data = fs.readFileSync(path, 'utf-8')
    } catch (error) {
        console.error(error)
    }
    return data
}

const writeFile = (path: string, data: string): void => {
    fs.writeFileSync(path, data)
}

// 传入命令和回调函数，注册命令
const registerCommand = (command: string, callback: any) => {
    vscode.commands.registerCommand(command, callback)
}

// 返回插件设置
// Path 是文件路径，例如：D:\Josh\xcuo\abc.txt
// annotationRule 是注释规则， 例如 /* content */ 或 <!-- content -->
const extensionConfig = (): config => {
    let config = vscode.workspace.getConfiguration()
    let path = config.get('readNovel.filePath') as string
    let annotationRule = config.get('readNovel.annotationRule') as string
    return {
        path,
        annotationRule,
    }
}

const register = (context: vscode.ExtensionContext): void => {
    // 注册 command：readNovel 命令
    log('register start')
    let command: string = 'readnovel.helloWorld'
    let config: config = extensionConfig()
    let action = (): void => {
        log('action')
        if (config.path === '') {
            console.error('路径不能为空')
            return
        }
        log('readFile before')
        let data: string = readFile(config.path)
        log('readFile after')
        log(data)
        vscode.window.showInformationMessage('Hello World from readNovel!')
    }
    let disposable: any = registerCommand(command, action)
    
    context.subscriptions.push(disposable)
    log('register done')
}

const activate = (context: vscode.ExtensionContext) => {
    register(context)

}

// this method is called when your extension is deactivated
const deactivate = () => {}

export { activate, deactivate }
