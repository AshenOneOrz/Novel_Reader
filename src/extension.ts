import * as vscode from 'vscode'
import * as fs from 'fs'

const log = console.log.bind(console)

const readFile = (path: string): string => {
    let data: string = ''
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
    let startingPosition = config.get('readNovel.startingPosition') as number
    let step = config.get('readNovel.step') as number
    return {
        path,
        annotationRule,
        startingPosition,
        step,
    }
}

const formattingContent = (data: string): string[] => {
    let lines = data.split('\r\n').filter((line) => {
        let l = line.trim()
        return l.length > 0
    })
    return lines
}

// 更新当前阅读的位置，因为文本是一行一行的，所以用数组 + 下标就可以实现这个功能了
const updateStartingPosition = async (n: number): Promise<void> => {
    let config = vscode.workspace.getConfiguration()

    let data: string[] = formattingContent(readFile(extensionConfig().path))
    if (n < 0) {
        n = 0
    } else if (n === data.length) {
        n -= 1
    }
    await config.update('readNovel.startingPosition', n, true)
}

const getNovelFragment = (config: config): string => {
    let data: string[] = formattingContent(readFile(config.path))

    let s = config.startingPosition
    let e = config.startingPosition + config.step
    let fragment = data.slice(s, e)
    return config.annotationRule.replace('$', fragment.join('\r\n'))
}

// 插入小说片段， config 是用户配置，data 中每一项都是一行小说片段， mode 分为 insert / replace，分别代表插入和替换
const updateNovelFragment = (mode: string): void => {
    // 获取当前选中的编辑窗口
    let editor: vscode.TextEditor = vscode.window
        .activeTextEditor as vscode.TextEditor

    let config: config = extensionConfig()
    editor.edit((editorContainer: vscode.TextEditorEdit) => {
        //
        // 被包装为注释形式的片段
        let fragment: string = getNovelFragment(config)
        // 光标位置
        let position: vscode.Position = new vscode.Position(0, 0)
        let range = new vscode.Range(
            position,
            new vscode.Position(config.step, 0),
        )
        if (mode === 'insert') {
            // 在第一行插入片段
            editorContainer.insert(position, fragment)
        } else if (mode === 'replace') {
            // 替换 range 内的片段
            editorContainer.replace(range, fragment)
        } else if (mode === 'clear') {
            editorContainer.replace(range, '')
        }
    })
}

const nextPage = (context: vscode.ExtensionContext) => {
    let command: string = 'readNovel.nextPage'

    // 先增加 StartingPosition
    let action = async (): Promise<void> => {
        let config: config = extensionConfig()
        let step: number = config.startingPosition + config.step
        await updateStartingPosition(step)
        updateNovelFragment('replace')
    }
    let disposable: any = registerCommand(command, action)
    context.subscriptions.push(disposable)
}

const prevPage = (context: vscode.ExtensionContext) => {
    let command: string = 'readNovel.prevPage'

    let action = async (): Promise<void> => {
        let config: config = extensionConfig()
        await updateStartingPosition(config.startingPosition - config.step)
        updateNovelFragment('replace')
    }
    let disposable: any = registerCommand(command, action)
    context.subscriptions.push(disposable)
}

const clear = (context: vscode.ExtensionContext) => {
    let command: string = 'readNovel.clear'

    let action = (): void => {
        updateNovelFragment('clear')
    }
    let disposable: any = registerCommand(command, action)
    context.subscriptions.push(disposable)
}

const setup = (context: vscode.ExtensionContext): void => {
    // 注册 command：readNovel 命令
    let command: string = 'readNovel.setup'
    let config: config = extensionConfig()
    // log(config)
    let action = (): void => {
        if (config.path === '') {
            console.error('路径不能为空')
            return
        }
        // log(data)
        updateNovelFragment('insert')
    }
    let disposable: any = registerCommand(command, action)
    context.subscriptions.push(disposable)
}

const register = (context: vscode.ExtensionContext): void => {
    nextPage(context)
    prevPage(context)
    setup(context)
    clear(context)
}

const activate = (context: vscode.ExtensionContext) => {
    register(context)
}

// this method is called when your extension is deactivated
const deactivate = () => {}

export { activate, deactivate }
