import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { SqlQueryManager } from '../queries';
import { Database } from '../common/database';
import { InfoNode } from './infoNode';

export class FunctionNode implements INode {
  constructor(public readonly connection: IConnection
    , public readonly func: string
    , public readonly args: string[]
    , public readonly ret: string
    , public readonly schema?: string) { }

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    let label = `${this.func}(${this.args.join(', ')}) : ${this.ret}`;
    let tooltip = label;

    return {
      label: label,
      tooltip: tooltip,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-foresight-devtool.tree.function',
      command: {
        title: 'edit-function',
        command: 'vscode-foresight-devtool.editFunction',
        arguments: [this]
      },
      iconPath: {
        light: path.join(__dirname, `../../resources/light/function.svg`),
        dark: path.join(__dirname, `../../resources/dark/function.svg`)
      }
    };
  }

  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);
    try {
      let query = SqlQueryManager.getVersionQueries(connection.pg_version);
      const res = await connection.query(query.GetFunctionDepends, [`%${this.func}%`]);
      if (res.rowCount > 0) {
        return res.rows.map<FunctionNode>(func => {
          var args = func.argument_types != null ? func.argument_types.split(',').map(arg => {
            return String(arg).trim();
          }) : [];
          return new FunctionNode(this.connection, func.name, args, func.result_type, func.schema);
        })
      }
      else {
        return [new InfoNode("No depended items")];
      }
    } catch (err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}