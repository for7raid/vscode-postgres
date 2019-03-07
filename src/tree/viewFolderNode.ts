import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from "../common/database";
import { InfoNode } from "./infoNode";
import { SqlQueryManager } from '../queries';
import { TableNode } from './tableNode';

export class ViewFolderNode implements INode {
  constructor(public readonly connection: IConnection
    , public readonly schemaName: string)
  {}

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    return {
      label: "Views",
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-foresight-devtool.tree.view-folder',
      iconPath: {
        light: path.join(__dirname, `../../resources/light/func-folder.svg`),
        dark: path.join(__dirname, `../../resources/dark/func-folder.svg`)
      }
    };
  }
  
  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);

    try {
   
      let query = SqlQueryManager.getVersionQueries(connection.pg_version);
      const res = await connection.query(query.GetViews, [this.schemaName]);

      return res.rows.map<TableNode>(table => {
        return new TableNode(this.connection, table.name, table.is_table, table.schema);
      });
      
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}