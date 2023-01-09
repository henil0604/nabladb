<h1 align="center">Welcome to NablaDb 2.0 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/nabladb" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/nabladb.svg">
  </a>
  <a href="#" target="_blank">
    <img alt="License: ISC" src="https://img.shields.io/badge/License-ISC-yellow.svg" />
  </a>
  <a href="https://twitter.com/henil0604" target="_blank">
    <img alt="Twitter: henil0604" src="https://img.shields.io/twitter/follow/henil0604.svg?style=social" />
  </a>
</p>

> An Advance File System API

### 🏠 [Homepage](https://github.com/henil0604/nabladb#readme)

## Install

```sh
npm install nabladb
```

## Ideology

This Simple Database allows you to quickly start a project where you needs database. The Database is self stored means it can exists inside the project structure. NablaDb uses object oriented approach to handle files and directories. NablaDb's First Priority is to make API type-safe and simple.


## Quick Start

```js
import NablaClient from 'nabladb';

const client = new NablaClient({
    verbose: 2,
    root: Path.join(process.cwd(), "test/.ndb"),
})

const db = client.db("my_app");

const users = db.collection("users");

users.insertSync([
    {
        email: "test@example.com",
        username: "test_user",
        password: "super_secret_hehe",
        verified_email: false
    },
    {
        email: "test2@example.com",
        username: "test_user_2",
        password: "you_can_not_hack_me",
        verified_email: false
    }
])

console.log(users.getAllSync()) // [{ email: "test@example.com"...}, { email: "test2@example.com"...}]
```


## API

### Types

```js
import * as NablaClientTypes from 'filic/types/NablaClient';
import * as NablaDbTypes from 'filic/types/NablaDb';
import * as NablaCollectionTypes from 'filic/types/NablaCollection';
```

### `NablaClient`

- #### `static NablaClient.create`

    Allows to create NablaClient Instance
    ```js
        import NablaClient from 'nabladb'

        const client = NablaClient.create(options?: NablaClientTypes.NablaClientOptions);
    ```

    - options: `NablaClientTypes.NablaClientOptions`

- #### `NablaClient.init`

    Manually Initialize Client

    > If `NablaClientTypes.NablaClientOptions.autoInit` is `true`, you don't need to run this function.

    ```js
        client.init();
    ```

- #### `NablaClient.db`

    Returns a `NablaDb` Instance

    ```js
        const db = client.db(dbName: string, options?: NablaDbTypes.NablaDbOptions);
    ```

    - dbName: `string`
        - Name of the Database
    - options: `NablaDbTypes.NablaDbOptions`

---

### `NablaDb`

```js
const db = client.db(dbName, options?: NablaDbTypes.NablaDbOptions);
```

- dbName: `string`
    - Name of the Database
- options: `NablaDbTypes.NablaDbOptions`


- #### `NablaDb.create`

    Create Database

    > If `NablaDbTypes.NablaDbOptions.autoCreate` is `true`, you don't need to run this function.

    ```js
        db.create()
    ```

- #### `NablaDb.delete`

    Delete Database

    ```js
        db.delete()
    ```

- #### `NablaDb.collection`

    Opens a Collection Inside a database

    ```js
        const collection = db.collection(collectionName: string, options?: NablaCollectionTypes.NablaCollectionOptions)
    ```

    - collectionName: `string`
        - Name of the Collection
    - options: `NablaCollectionTypes.NablaCollectionOptions`

- #### `NablaDb.exists`

    Checks if Database exists

    ```js
        db.exists // boolean
    ```

- #### `NablaDb.$DbDir`

    Returns `Filic.Directory` Instance of directory of the database

- #### `NablaDb.$CollectionsDir`

    Returns `Filic.Directory` Instance of directory of `"collections"` inside database directory

- #### `NablaDb.$DbJson`

    Returns `Filic.File` instance of `"<db>.json"` file

- #### `NablaDb.Client`

    Returns `NablaClient` Instance.

---

### `NablaCollection`

```js
    const collection = db.collection(collectionName: string, options?: NablaCollectionTypes.NablaCollectionOptions)
```

- collectionName: `string`
    - Name of the Collection
- options: `NablaCollectionTypes.NablaCollectionOptions`

- #### `NablaCollection.create`

    Create Collection

    > If `NablaCollectionTypes.NablaCollectionOptions.autoCreate` is `true`, you don't need to run this function.

    ```js
        collection.create()
    ```

- #### `NablaCollection.delete`

    Delete Collection

    ```js
        collection.delete()
    ```

- #### `NablaCollection.insert`

    Insert a single document

    ```js
    collection.insertSync({
        key1: "value1",
        key2: {
            key3: true,
            key4: [6, 4, 6]
        }
    })
    ```

- #### `NablaCollection.insertMany`

    Insert multiple documents

    ```js
    collection.insertManySync([
        doc1,
        doc2,
        doc3,
        ...
    ])
    ```

- #### `NablaCollection.getAll`

    Gets all documents in collection

    ```js
    collection.getAllSync()
    ```

- #### `NablaCollection.getMany`

    Find Many multiple documents where fields that match given condition object

    ```js
    collection.getManySync({
        verified: false
    })
    // finds every document in the collection with `verified` that is `false`
    ```

- #### `NablaCollection.getMany`

    Find First document where fields that match given condition object

    ```js
    collection.getFirstSync({
        verified: false
    })
    // finds first document in the collection with `verified` that is `false`
    ```

- #### `NablaCollection.deleteFirst`

    Delete First document with fields that match given condition object

    ```js
    collection.deleteFirstSync({
        email: "example@example.com"
    })
    ```

- #### `NablaCollection.deleteMany`

    Delete every document with fields that match given condition object

    ```js
    collection.deleteManySync({
        expired: true
    })
    ```

- #### `NablaCollection.updateFirst`

    Update first document with fields that match given condition object

    ```js
    collection.updateFirstSync({
        password: "123"
    }, {
        password: "new_password"
    })
    ```

- #### `NablaCollection.updateMany`

    Update every document with fields that match given condition object

    ```js
    collection.updateManySync({
        password: "123"
    }, {
        bad_password_user: true
    })
    ```


- #### `NablaCollection.exists`

    Checks if Collection exists

    ```js
        collection.exists // boolean
    ```

- #### `NablaCollection.$CollectionJson`

    Returns `Filic.Directory` instance of `<collection>.json` file in `collections` directory of database

- #### `NablaCollection.Db`

    Returns `NablaDb` Instance

***

## Author

👤 **Henil Malaviya**

* E-mail: [henilmalaviya06@gmail.com](mailto:henilmalaviya06@gmail.com)
* Website: [henil.xyz](https://henil.xyz)
* Twitter: [@henil0604](https://twitter.com/henil0604)
* Github: [@henil0604](https://github.com/henil0604)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/henil0604/nabladb/issues). 

## Show your support

Give a ⭐️ if this project helped you!