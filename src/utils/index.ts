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

// 传入命令和回调函数，注册命令
const registerCommand = (command: string, callback: any) => {
    vscode.commands.registerCommand(command, callback)
}

// 删除小说内的空行，去除每一行首位的空格
const formattingContent = (data: string): string[] => {

    let lines = data.split('\r\n').filter((line) => {
        let l = line.trim()
        return l.length > 0
    })

    return lines
}

export { log, readFile, registerCommand, formattingContent }
