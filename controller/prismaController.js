const prisma = require('../config/prismaClient');


function buildFolderTree(allFolders) {
  // Build a Map for easy lookup
  const folderMap = new Map();

  // Initialize the map with folder objects
  allFolders.forEach(folder => {
    folderMap.set(folder.id, { id: folder.id, name: folder.name, children: [] });
  });

  // Link child rows to their parents
  const folderTree = [];

  allFolders.forEach(folder => {
    const folderObj = folderMap.get(folder.id);
    if (!folderObj) return;

    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        parent.children.push(folderObj);
      }
    } else {
      // This is a root folder
      folderTree.push(folderObj);
    }
  });

  return folderTree;
}

async function getAllFolders(userId) {
  const folderRows = await prisma.driveItem.findMany({
    where: { type: 'FOLDER', ownerId: userId},
    select: { id: true, name: true, parentId: true, 
      // Use this if you want the children folder names as an array
      // children: {select: {name: true}} 
    },
    orderBy: { createdAt: 'asc' }
  });

  // const userFolders = rows.map(row => ({ ...row, 
  //   children: row.children.map(child => child.name)
  // }));

  const folderTree = buildFolderTree(folderRows);

  return folderTree
}


async function getFolderContents(userId, folderId) {
  const rows = await prisma.driveItem.findMany({
    where: {
      parentId: folderId,
      ownerId: userId
    },
    orderBy: [
      // Folders first, then files
      { type: 'asc' },
      { name: 'asc' }
    ]
  });

  // Extract basename from file public_id
  const renamedRows = rows.map(row => { 
    if (row.type === 'FOLDER') {
      return {...row};
    } else if (row.type === 'FILE') {
      return {...row, name: row.name.split('/').pop()}
    }
  });

  return renamedRows;
}

async function findRootDirId(userId) {
  const row = await prisma.driveItem.findFirst({
    where: {
      ownerId: userId,
      name: "root",
      parentId: null,
    },
    select: { id: true }
  })
  return row ? row.id : null;
}

async function createFolder(name, parentId, userId) {
  await prisma.driveItem.create({
    data: {
      name: name,
      type: 'FOLDER',
      ownerId: userId,
      parentId: parentId
    }
  });
}

async function uploadFile(userId, parentId, fileName, url, fileExt, fileSize) {
  await prisma.driveItem.create({
    data: {
      name: fileName,
      type: 'FILE',
      url: url,
      mimeType: fileExt,
      fileSize: fileSize,
      ownerId: userId,
      parentId: parentId
    }
  });
}

async function getStorageUsed(userId) {
  const total = await prisma.driveItem.aggregate({
    _sum: {
      fileSize: true,
    },
    where: {
      ownerId: userId,
    }
  })
  return total._sum.fileSize;
}

async function getFilePathPg(itemId) {
  // Implement the file search with postgres recursive to minimize multiple db connections
  const result = await prisma.$queryRaw`
    WITH RECURSIVE path_query AS (
      -- Base case: the starting item
      SELECT rt.id, rt.name, rt."parentId", 
            ARRAY[jsonb_build_object('id', rt.id, 'name', rt.name)] AS path_array 
            FROM "DriveItem" rt
      WHERE rt.id = ${itemId}
      
      UNION ALL
      
      -- Recursive case: join with parent, and Prepend parent name to path array
      SELECT p.id, p.name, p."parentId", 
            array_prepend(jsonb_build_object('id', p.id, 'name', p.name),pq.path_array) 
            FROM "DriveItem" p
      JOIN path_query pq ON p.id = pq."parentId"
    )
    -- Select the longest path (the one that reached the root)
    SELECT path_array FROM path_query WHERE "parentId" IS NULL LIMIT 1;
  `;
  
  // The result will be an array with one element containing the path array
  return result.length > 0 ? result[0].path_array : [];
}

// async function getFilePath(itemId) {
//   // JS while loop requires connecting to the db multiple times
//   let filePath = [];
//   let currItem = itemId;

//   while (currItem) {
//     // Get the current folder
//     const folder = await prisma.driveItem.findUnique({
//       where: { id: currItem },
//       select: { name: true, parentId: true }
//     });

//     if (!folder.parentId) {
//       // If no parent is found, break
//       filePath.unshift(folder.name);
//       break
//     } else {
//       filePath.unshift(folder.name); // Insert folder name to the beginning
//       currItem = folder.parentId;
//     };     
//   }

//   return filePath;
// }

async function getItemRow(userId,itemId) {
  const row = await prisma.driveItem.findFirst({
    where: {
      ownerId: userId,
      id: itemId
    }
  })
  return row;
}

async function getAllChildrenFiles(userId,itemId) {
  // This uses PostgreSQL's WITH RECURSIVE feature to 
  // extract all children files linked to parent folder
  const result = await prisma.$queryRaw`
    WITH RECURSIVE tree AS (
      SELECT * FROM "DriveItem" WHERE id = ${itemId} AND "ownerId" = ${userId}
      UNION ALL
      SELECT i.* FROM "DriveItem" i
      INNER JOIN tree t ON i."parentId" = t.id
    )
    SELECT * FROM tree WHERE type = 'FILE' ORDER BY name;
  `;
  
  return result;
}

async function createExpiryUrl(downloadId, privateUrl, expiresAt) {
  const row = await prisma.driveExpiry.create({
    data: {
      downloadId: downloadId,
      privateUrl: privateUrl,
      expiresAt: expiresAt
    }
  });
  return row;
}

async function getExpiryUrl(downloadId) {
  const row = await prisma.driveExpiry.findUnique({
    where: {
      downloadId: downloadId
    }
  })
  return row;
}


module.exports = { 
  buildFolderTree, getAllFolders, getFolderContents, 
  findRootDirId, createFolder, uploadFile, getFilePathPg, 
  getStorageUsed, getItemRow, getAllChildrenFiles, 
  createExpiryUrl, getExpiryUrl
}