import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from '../common/database';
import { TableNode } from './tableNode';
import { InfoNode } from './infoNode';
import { SchemaNode } from './schemaNode';
import { SqlQueryManager } from '../queries';

export class DatabaseNode implements INode {

  constructor(private readonly connection: IConnection) {}

  public getTreeItem(): TreeItem {
    return {
      label: this.connection.database,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.database',
      command: {
        title: 'select-database',
        command: 'vscode-postgres.setActiveConnection',
        arguments: [ this.connection ]
      },
      iconPath: {
        light: path.join(__dirname, '../../resources/light/database.svg'),
        dark: path.join(__dirname, '../../resources/dark/database.svg')
      }
    }
  }

  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);
    let query = SqlQueryManager.getVersionQueries(connection.pg_version);
    try {
      const res = await connection.query(query.GetSchemas);
      return res.rows.map<SchemaNode>(schema => {
        return new SchemaNode(this.connection, schema.name);
      })
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}