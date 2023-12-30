import express from 'express';
import accessToken from '../middleware/accessToken';
import isUserExist from '../middleware/isUserExist';

import { getProject, getProjects, postProject, patchProject, deleteProject, quitProject } from '../api/project';
import { getMembers, postMember, deleteMember, patchMember } from '../api/member';
import { postTask, getTask, patchTask, deleteTask } from '../api/task';
import { postSubTask, deleteSubTask, patchSubTask } from '../api/subtask';
const router = express.Router();

router.get('/:id', accessToken, isUserExist, (req, res) => {
    getProject(req, res)
})

router.get('/project/all', accessToken, isUserExist, (req, res) => {
    getProjects(req, res)
})

router.post('/', accessToken, isUserExist, (req, res) => {
    postProject(req, res)
})

router.patch('/:id', accessToken, isUserExist, (req, res) => {
    patchProject(req, res)
})

router.delete('/:id', accessToken, isUserExist, (req, res) => {
    deleteProject(req, res)
})

router.delete('/:id/quit', accessToken, isUserExist, (req, res) => {
    quitProject(req, res)
})

router.get('/:id/member', accessToken, isUserExist, (req, res) => {
    getMembers(req, res)
})

router.post('/:id/member', accessToken, isUserExist, (req, res) => {
    postMember(req, res)
})

router.delete('/:id/member', accessToken, isUserExist, (req, res) => {
    deleteMember(req, res)
})

router.patch('/:id/member', accessToken, isUserExist, (req, res) => {
    patchMember(req, res)
})

router.post('/:id/task', accessToken, isUserExist, (req, res) => {
    postTask(req, res)
})

router.get('/:id/task/:taskId', accessToken, isUserExist, (req, res) => {
    getTask(req, res)
})

router.patch('/:id/task/:taskId', accessToken, isUserExist, (req, res) => {
    patchTask(req, res)
})

router.delete('/:id/task', accessToken, isUserExist, (req, res) => {
    deleteTask(req, res)
})

router.post('/:id/task/:taskId/subtask', accessToken, isUserExist, (req, res) => {
    postSubTask(req, res)
})

router.patch('/:id/task/:taskId/subtask/:subtaskId', accessToken, isUserExist, (req, res) => {
    patchSubTask(req, res)
})

router.delete('/:id/task/:taskId/subtask', accessToken, isUserExist, (req, res) => {
    deleteSubTask(req, res)
})

export default router;