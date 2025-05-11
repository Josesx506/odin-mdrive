const crypto = require('crypto');
const utils = require('../utils');
const prisma = require('../config/prismaClient');
const prismaCntlr = require('./prismaController');
const cloudinary = require('../config/cloudinary');
require('dotenv').config();


function protectRoutes(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/auth/signin')
  }
};

async function getDriveView(req,res) {
  const userId = parseInt(req.user.id);
  let itemId = req.params.itemId ? req.params.itemId : await prismaCntlr.findRootDirId(userId);
  itemId = parseInt(itemId);

  const userStorage = await prismaCntlr.getStorageUsed(userId);
  const maxStorage = process.env.BASIC_STORAGE;
  
  const content = itemId ? await prismaCntlr.getFolderContents(userId, itemId) : [];
  const filePath = itemId ? await prismaCntlr.getFilePathPg(itemId) : ["root"];
  const folders = await prismaCntlr.getAllFolders(userId);

  res.render("drive", {
      title: "Media Drive",
      itemId: itemId,
      alert: req.flash('alert'),
      folders: folders,
      filePath: filePath,
      folderContent: content,
      dateFmtr: utils.formatDateTime,
      userStorage: userStorage,
      maxStorage: maxStorage,
      prgFmtr: utils.getProgressBarColor
  });
}

async function postFolder(req,res) {
  const name = utils.escapeString(req.body.createFolder);
  const itemId = req.query.itemId || null;
  const userId = parseInt(req.user.id);

  let parentId = itemId ? itemId : await prismaCntlr.findRootDirId(userId);
  parentId = parseInt(parentId);

  // Check that the file name does not already exist in the db
  const content = itemId ? await prismaCntlr.getFolderContents(userId, parentId) : [];
  const match = content.filter(item=>item.name.toLowerCase()===name.toLowerCase());

  if (match.length>0) {
    req.flash('alert',"Name Error: Folder exists");
    res.redirect(`/drive/view/${parentId}`);
  } else {
    // Create a new directory inside an existing parent
    await prismaCntlr.createFolder(name, parentId, userId);
    req.flash('alert',"Folder created successfully");
    res.redirect(`/drive/view/${parentId}`);
  }
}

async function postFile(req,res, next) {
  // Earlier errors are handled with Multer Middleware
  const userId = parseInt(req.user.id);
  const userStorage = await prismaCntlr.getStorageUsed(userId);

  const itemId = req.query.itemId || null;
  let parentId = itemId ? itemId : await prismaCntlr.findRootDirId(userId);
  parentId = parseInt(parentId);
  const maxStorage = process.env.BASIC_STORAGE;

  const fileSize = req.file ? utils.bytesToMB(req.file.size) : 0;
  const tag = req.file.mimetype.split("/")[1];
  const fileExt = req.file.originalname.split('.').pop().toLowerCase();
  const resourceType = utils.resolveResourceType(fileExt);
  const fileName = utils.escapeString(req.file.originalname);

  // Resolve the upload directory
  // folder name is a combination of username and user directory
  const userName = req.user.name;
  let dirPath = await prismaCntlr.getFilePathPg(parentId);
  dirPath = dirPath.map(row => row.name);
  dirPath = dirPath.join("/");
  const uploadDir = `odin_drive/${userName}/${dirPath}`

  // Limit uploads by user storage
  if (userStorage+fileSize > maxStorage) {
    req.flash('alert',"Out of space. Delete items!");
    return res.redirect(`/drive/view/${parentId}`);
  } 
  // Check for duplicates
  const content = itemId ? await prismaCntlr.getFolderContents(userId, parentId) : [];
  const match = content.filter(item=>item.name.toLowerCase()===fileName.toLowerCase());
  if (match.length>0) {
    req.flash('alert',"Name Error: File already exists");
    return res.redirect(`/drive/view/${parentId}`);
  } 
  
  else {
    cloudinary.uploader.upload_stream({ 
      resource_type: resourceType,
      public_id: fileName,
      overwrite: true,
      invalidate: true,
      folder: uploadDir  }, 
      
      async (err, result) => {
        if(err) {
          return next(err);
        }
        
        // Upload to postgres
        await prismaCntlr.uploadFile(
          userId,parentId,result.public_id,result.secure_url,
          fileExt, fileSize
        )
        req.flash('alert',"File uploaded successfully");
        res.redirect(`/drive/view/${parentId}`);
  }).end(req.file.buffer); 
  }
}

async function deletebyId(req, res, next) { 
  const userId = parseInt(req.user.id);
  const rootId = await prismaCntlr.findRootDirId(userId);
  let itemId = req.params.itemId || null;

  if (!itemId) {
    req.flash('alert',"Invalid delete request");
    return res.redirect(`/drive/view/${rootId}`);
  } 

  if (parseInt(itemId) === rootId) {
    req.flash('alert',"Root directory cannot be deleted");
    return res.redirect(`/drive/view/${rootId}`);
  } 
  
  else {
    itemId = parseInt(itemId);
    let itemRow = await prismaCntlr.getItemRow(userId,itemId);

    // Delete all child files in a folder
    if (itemRow.type==='FOLDER') {
      
      // Extract all the public ids for children files
      let children = await prismaCntlr.getAllChildrenFiles(userId, itemId);
      
      const result = await prisma.$transaction(async (tx) => {
        // All database operations go here - use tx instead of prisma for queries within the transaction
        if (children.length>0) {
          // All the children of a folder
          children = children.map((child) => {
            return { 
              public_id: child.name, 
              resourceType: utils.resolveResourceType(child.mimeType)
            }});
          
          // Group the files using reduce
          const groupedFiles = children.reduce((acc, file) => {
              if (!acc[file.resourceType]) {
                  acc[file.resourceType] = [];
              }
              acc[file.resourceType].push(file.public_id);
              return acc;
          }, {});
          // Delete all non-empty groups
          for (const [type, publicIds] of Object.entries(groupedFiles)) {
            if (publicIds.length > 0) {
                try {
                    const response = await cloudinary.api.delete_resources(publicIds, { 
                      resource_type: type, 
                      invalidate: true 
                    });
                    // console.log(`Deleted ${type} files:`, response);
                } catch (error) {
                    return next(error);
                }
            }
          }
          // Remove db entry
          const remove = await tx.driveItem.delete({ where: { id: itemRow.id }})
        } else {
          // Remove empty folders
          const remove = await prisma.driveItem.delete({ where: { id: itemRow.id }})
        }
      });
    } 
    
    // Delete individual files
    else {
      const result = await prisma.$transaction(async (tx) => {
        try {
          const resp = await cloudinary.uploader.destroy(itemRow.name, { 
            resource_type: utils.resolveResourceType(itemRow.mimeType), 
            invalidate: true
          })
          // Delete the item from the db
          const remove = await tx.driveItem.delete({ where: { id: itemRow.id }})
        } catch (error) {
          return next(error);
        }
      }) 
    }

    const parentId = itemRow.parentId || '';
    req.flash('alert',`${itemRow.type.toLowerCase()} deleted successfully`);
    res.redirect(`/drive/view/${parentId}`);
  } 
}


async function shareById(req, res) {
  const userId = parseInt(req.user.id);
  const itemId = parseInt(req.body.itemId);
  const expirationSeconds = parseInt(req.body.duration) * 60 * 60;

  const expiresAt = Math.floor(Date.now() / 1000) + expirationSeconds;
  

  let itemRow = await prismaCntlr.getItemRow(userId,itemId);
  let privLink = await cloudinary.utils.private_download_url(
    itemRow.name,itemRow.mimeType, {
      resource_type: utils.resolveResourceType(itemRow.mimeType),
      type: 'upload',
      expires_at: expiresAt,
  });

  // Create a link and insert it into the db
  const downloadId = crypto.randomBytes(16).toString('hex');
  const sharedLink = `${req.protocol}://${req.get('host')}/public-media/${downloadId}`;
  const newLink = await prismaCntlr.createExpiryUrl(downloadId,privLink,expiresAt);

  res.status(200).json({ link: sharedLink })
}


module.exports = { 
  protectRoutes,getDriveView,postFolder,
  postFile,deletebyId,shareById }