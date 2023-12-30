import express from 'express';

import { userRegister, userLogin } from '../api/auth';
const router = express.Router();

router.post('/register', (req, res) => {
    userRegister(req, res)
})

router.post('/login', (req, res) => {
    userLogin(req, res)
})

router.get('/', (req, res) => {
    res.send('API Online')
})

export default router;