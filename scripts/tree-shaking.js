const shortid = require('shortid');
const tree = {
    "module": "/",
    children: [
        {
            module: "File 1"
        },
        {
            module: "Dir 1",
            children: [
                {
                    module: "File 2"
                },
                {
                    module: "File 3"
                },
                {
                    module: 'Dir 2',
                    children: [
                        {
                            module: 'File 4'
                        },
                        {
                            module: 'Dir 3',
                            children: []
                        }
                    ]
                }
            ]
        }
    ]
}
let lookup = {}
const buildLookup = (node, parent) => {
    node.parent = parent;
    lookup[node.module] = node;
    if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
            buildLookup(node.children[i], node);
        }
    }
}
const treeFromLookup = (newTree, lookupObj, moduleName) => {
    newTree = lookupObj[moduleName];
    if (newNames[moduleName]) {
        newTree.module = newNames[moduleName]
    }
    newTree.parent = undefined
    if (newTree.children !== undefined) {
        const children = []
        newTree.children.forEach((child) => {
            if (lookup[child.module] !== null) {
                const index = newTree.children.indexOf(child);
                obj = treeFromLookup(newTree, lookupObj, newTree.children[index].module);
                children.push(obj)
            }
        })
        newTree.children = children
    }
    return newTree;
}
const objectFlip = (obj) => {
    const ret = {};
    Object.keys(obj).forEach((key) => {
        ret[obj[key]] = key;
    });
    return ret;
}
const deleteFromLookup = (lookupObj, moduleName) => {
    const flippedAlias = objectFlip(newNames);
    if (flippedAlias[moduleName]) {
        moduleName = flippedAlias[moduleName];
    }
    lookupObj[moduleName] = null;
    return lookupObj;
}
const newNames = {}
const editInLookup = (lookupObj, moduleName, newName) => {
    if (!lookupObj[moduleName]) return lookupObj
    newNames[moduleName] = newName;
    return lookupObj;
}

const addFile = (lookupObj, module, fileName) => {
    const newModule = {}
    newModule.module = fileName;
    module.children.push(newModule);
    lookupObj[fileName] = newModule;
    return lookupObj;
}

const addDir = (lookupObj, module, dirName) => {
    const newModule = {}
    newModule.module = dirName;
    newModule.children = [];
    module.children.push(newModule);
    lookupObj[dirName] = newModule;
    return lookupObj;
}
const getModule = (lookupObj, moduleName) => {
    const flippedAlias = objectFlip(newNames);
    if (newNames[moduleName])
        moduleName = flippedAlias[moduleName];
    return lookupObj[moduleName];
}

// buildLookup(tree, null);
// console.log(JSON.stringify(treeFromLookup({}, lookup, 'Module 1')));
// lookup = editInLookup(lookup, 'Module 4', 'Module x')
// lookup = deleteFromLookup(lookup, 'Module x')
// lookup = addFile(lookup, getModule(lookup, 'Module 3'), 'MODULE Y')
// lookup = addDir(lookup, getModule(lookup, 'Module 3'), 'DirModule')
// console.log(newNames)
// lookup = deleteFromLookup(lookup, 'MODULE Y')
// lookup = addDir(lookup, getModule(lookup, 'Module 3'), 'zzzirGrizzz')
console.log(lookup)

// console.log(JSON.stringify(treeFromLookup({}, lookup, 'Module 1')));
const buildPaths = (c_tree, pathString, paths) => {
    pathString += c_tree.module;
    if (c_tree.children === undefined ) {
        paths.push(pathString);
        return;
    }
    if(c_tree.children.length === 0) {
        pathString += '/.gitkeep'
        paths.push(pathString);
        return
    }

    pathString += '/'
    c_tree.children.forEach((e, i) => buildPaths(e, pathString, p))
    
}
const deepParenting = (node, path) => {
    console.log(node)
    if (node.parent !== null) {
        path.push(deepParenting(node.parent, path))
        return path.parent.module;
    }
    else path.push('/')
}

let p = []
buildPaths(tree, '/', p);
p = p.map(path => path.slice(3))
// paths = paths.map(path => path.split('')[path.length - 1] === '/'? path += '.gitignore': path)

console.log(p)

