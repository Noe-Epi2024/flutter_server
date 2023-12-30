import express from 'express';
import accessToken from '../middleware/accessToken';
import isUserExist from '../middleware/isUserExist';

import { getMe, patchMe, getUsers } from '../api/user';
const router = express.Router();

router.get('/me', accessToken, isUserExist, (req, res) => {
    getMe(req, res)
})

router.patch('/me', accessToken, isUserExist, (req, res) => {
    patchMe(req, res)
})

router.get('/all', accessToken, isUserExist, (req, res) => {
    getUsers(req, res)
})

export default router;