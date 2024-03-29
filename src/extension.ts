import * as vscode from 'vscode'
import {
    log,
    readFile,
    registerCommand,
    formattingContent,
} from './utils/index'

const NovelReader = class {
    // vscode 上下文
    context: vscode.ExtensionContext
    // 小说文件数据
    data: string[]

    // 初始化小说文件的数据和上下文
    constructor(context: vscode.ExtensionContext) {
        this.context = context
        this.data = []
    }

    // 获取小说片段，包装为注释的形式
    getNovelFragment(config: config): string {
        // 因为要支持多行，所以 s 是起始位置， e 是结束位置（起始位置 + 设置的行数）
        let s = config.startingPosition
        let e = config.startingPosition + config.step
        let fragment: string | string[] = this.data.slice(s, e)

        for (let i = fragment.length; i < config.step; i++) {
            fragment.push(' ')
        }

        fragment = fragment.join('\r\n')
        return config.annotationRule.replace('$', fragment) + '\r\n'
    }

    // 插入小说片段，mode 分为 insert / replace / clear，分别代表插入（首次打开插件时会执行）和替换（翻页）以及清除（老板键）
    insertNovelFragment(mode: string): void {
        // 获取当前选中的编辑窗口
        let editor: vscode.TextEditor = vscode.window
            .activeTextEditor as vscode.TextEditor

        let config: config = this.extensionConfig()
        editor.edit((editorContainer: vscode.TextEditorEdit) => {
            // 获取到被包装为注释形式的片段
            let fragment: string = this.getNovelFragment(config)
            // log(fragment)
            // log(config)
            // 光标位置
            let position: vscode.Position = new vscode.Position(0, 0)
            // 要替换的区域，从左上角的 0，0 处开始
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
                // 替换 range 内的片段为空字符串
                let step = config.step
                fragment = ''
                for (let i = 0; i < step; i++) {
                    fragment += '\r\n'
                }
                editorContainer.replace(range, fragment)
            }
        })
    }

    // 更新当前阅读的位置
    async updateStartingPosition(n: number): Promise<void> {
        let config = vscode.workspace.getConfiguration()

        if (n < 0) {
            n = 0
        } else if (n === this.data.length) {
            n -= 1
        }

        // true 代表更新到 vscode 全局设置中
        await config.update('novelReader.startingPosition', n, true)
    }

    // 返回插件设置
    // Path 是文件路径，例如：D:\Josh\xcuo\abc.txt
    // annotationRule 是注释规则， 例如 /* content */ 或 <!-- content -->
    // startingPosition 是起始位置， 例如 3 就是从第 2 行开始看（因为文本是数组形式）
    // step 代表了步长，例如 3 就是一次看 3 行
    extensionConfig(): config {
        let config = vscode.workspace.getConfiguration()
        // log('config.get is', config.get('novelReader'))
        let novelReaderConfig = config.get('novelReader') as config
        log('novelReaderConfig is', novelReaderConfig)
        return novelReaderConfig
    }

    // 下一页
    registerNextPage() {
        let command: string = 'novelReader.nextPage'

        let action = async (): Promise<void> => {
            let config: config = this.extensionConfig()
            let step: number = config.startingPosition + config.step
            await this.updateStartingPosition(step)
            this.insertNovelFragment('replace')
        }

        let disposable: any = registerCommand(command, action)
        this.context.subscriptions.push(disposable)
    }

    registerPrevPage() {
        let command: string = 'novelReader.prevPage'

        let action = async (): Promise<void> => {
            let config: config = this.extensionConfig()
            let step: number = config.startingPosition - config.step
            await this.updateStartingPosition(step)
            this.insertNovelFragment('replace')
        }

        let disposable: any = registerCommand(command, action)
        this.context.subscriptions.push(disposable)
    }

    registerClear() {
        let command: string = 'novelReader.clear'

        let action = (): void => {
            this.insertNovelFragment('clear')
        }

        let disposable: any = registerCommand(command, action)
        this.context.subscriptions.push(disposable)
    }

    // 初次打开时，初始化文件并在文件开头插入小说片段
    registerOpen(): void {
        let command: string = 'novelReader.open'
        let config: config = this.extensionConfig()

        let data: string[] = formattingContent(readFile(config.filePath))
        this.data = data

        let action = (): void => {
            if (config.filePath === '') {
                console.error('路径不能为空')
                return
            }
            this.insertNovelFragment('insert')
        }

        let disposable: any = registerCommand(command, action)
        this.context.subscriptions.push(disposable)
    }

    registerCommands(): void {
        // 注册所有事件
        this.registerOpen()
        this.registerNextPage()
        this.registerPrevPage()
        this.registerClear()
    }

    setup() {
        this.registerCommands()
    }

    static new(context: vscode.ExtensionContext) {
        return new NovelReader(context)
    }
}

const activate = (context: vscode.ExtensionContext) => {
    let reader = NovelReader.new(context)
    reader.setup()
}

// this method is called when your extension is deactivated
const deactivate = () => {}

export { activate, deactivate }
