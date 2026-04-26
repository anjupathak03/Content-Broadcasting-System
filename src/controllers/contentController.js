const contentService = require('../services/contentService');
const { normalizeSubject } = require('../utils/normalizers');

async function uploadContent(req, res) {
  const content = await contentService.uploadContent({
    teacher: req.user,
    file: req.file,
    body: req.body,
  });

  res.status(201).json({
    success: true,
    message: 'Content uploaded and submitted for approval',
    data: content,
  });
}

async function listMine(req, res) {
  const query = {
    ...req.query,
    subject: req.query.subject ? normalizeSubject(req.query.subject) : undefined,
  };
  const result = await contentService.listTeacherContent(req.user.id, query);
  res.json({
    success: true,
    ...result,
  });
}

async function listAll(req, res) {
  const query = {
    ...req.query,
    subject: req.query.subject ? normalizeSubject(req.query.subject) : undefined,
    teacherId: req.query.teacher_id,
  };
  const result = await contentService.listAllContent(query);
  res.json({
    success: true,
    ...result,
  });
}

async function listPending(req, res) {
  const result = await contentService.listAllContent({
    ...req.query,
    status: 'pending',
    subject: req.query.subject ? normalizeSubject(req.query.subject) : undefined,
    teacherId: req.query.teacher_id,
  });
  res.json({
    success: true,
    ...result,
  });
}

async function getById(req, res) {
  const content = await contentService.getContentByIdForUser(req.params.id, req.user);
  res.json({
    success: true,
    data: content,
  });
}

async function updateSchedule(req, res) {
  const content = await contentService.updateSchedule({
    teacher: req.user,
    contentId: req.params.id,
    payload: req.body,
  });

  res.json({
    success: true,
    message: 'Schedule updated',
    data: content,
  });
}

module.exports = {
  uploadContent,
  listMine,
  listAll,
  listPending,
  getById,
  updateSchedule,
};
