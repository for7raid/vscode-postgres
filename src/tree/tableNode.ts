import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from '../common/database';
import { InfoNode } from './infoNode';
import { ColumnNode } from './columnNode';
import { Global } from '../common/global';
import { QueryResult } from 'pg';
import { SqlQueryManager } from '../queries';
import { tableColumnsNode } from './tableColumnsNode';

export class TableNode implements INode {

  constructor(public readonly connection: IConnection
            , public readonly table: string
            , public readonly is_table: boolean
            , public readonly schema?: string)
  {}

  public getQuotedTableName(): string {
    let quotedSchema = this.schema && this.schema !== 'public' ? Database.getQuotedIdent(this.schema) : null;
    let quotedTable = Database.getQuotedIdent(this.table);
    return quotedSchema ? `${quotedSchema}.${quotedTable}` : quotedTable;
  }

  public getTreeItem(): TreeItem {
    return {
      label: this.table,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: this.is_table ? 'vscode-foresight-devtool.tree.table' : 'vscode-foresight-devtool.tree.view',
      iconPath: {
        light: path.join(__dirname, `../../resources/light/${this.is_table ? 'table' : 'view'}.svg`),
        dark: path.join(__dirname, `../../resources/dark/${this.is_table ? 'table' : 'view'}.svg`)
      }
    };
  }

  public async getChildren(): Promise<INode[]> {
      return [
          new tableColumnsNode(this.connection, this.table, this.schema)
      ];
  }
}