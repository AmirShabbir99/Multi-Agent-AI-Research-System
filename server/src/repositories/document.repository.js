'use strict';

const Document = require('../models/Document.model');
const Upload = require('../models/Upload.model');

class DocumentRepository {
  createUpload(data) {
    return Upload.create(data);
  }

  updateUpload(id, update) {
    return Upload.findByIdAndUpdate(id, update, { new: true });
  }

  createDocument(data) {
    return Document.create(data);
  }

  findDocumentById(id) {
    return Document.findOne({ _id: id, isDeleted: false });
  }

  findDocumentByAiId(aiDocumentId) {
    return Document.findOne({ aiDocumentId, isDeleted: false });
  }

  async findAllForUser(userId, { page = 1, limit = 20, status } = {}) {
    const query = { owner: userId, isDeleted: false };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      Document.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('upload'),
      Document.countDocuments(query),
    ]);

    return { documents, total, page, pages: Math.ceil(total / limit) };
  }

  async findAllForAdmin({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [documents, total] = await Promise.all([
      Document.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name email')
        .populate('upload'),
      Document.countDocuments({ isDeleted: false }),
    ]);
    return { documents, total, page, pages: Math.ceil(total / limit) };
  }

  updateDocument(id, update) {
    return Document.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  softDelete(id) {
    return Document.findByIdAndUpdate(id, { isDeleted: true, status: 'deleted' }, { new: true });
  }

  countForUser(userId) {
    return Document.countDocuments({ owner: userId, isDeleted: false });
  }
}

module.exports = new DocumentRepository();
