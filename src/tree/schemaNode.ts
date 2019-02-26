import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from "../common/database";
import { TableNode } from "./tableNode";
import { InfoNode } from "./infoNode";
import { Global } from '../common/global';
import { FunctionFolderNode } from './funcFolderNode';
import { TableFolderNode } from './tableFolderNode';
import { ViewFolderNode } from './viewFolderNode';

export class SchemaNode implements INode {

  constructor(private readonly connection: IConnection, private readonly schemaName: string) { }

  public getTreeItem(): TreeItem {
    return {
      label: this.schemaName,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.schema',
      command: {
        title: 'select-database',
        command: 'vscode-postgres.setActiveConnection',
        arguments: [this.connection]
      },
      iconPath: {
        light: path.join(__dirname, '../../resources/light/schema.svg'),
        dark: path.join(__dirname, '../../resources/dark/schema.svg')
      }
    };
  }

  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);


    try {
      let childs = [];

      childs.push(new FunctionFolderNode(this.connection, this.schemaName));
      childs.push(new TableFolderNode(this.connection, this.schemaName));
      childs.push(new ViewFolderNode(this.connection, this.schemaName));


      return childs;
    } catch (err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}