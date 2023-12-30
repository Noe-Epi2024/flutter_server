import express from 'express';
import multer from 'multer';
import accessToken from '../middleware/accessToken';
import isUserExist from '../middleware/isUserExist';
import { addPicture, getPicture } from '../api/picture';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', accessToken, isUserExist, upload.single('file'), (req, res) => {
    addPicture(req, res)
})

router.get('/', accessToken, isUserExist, (req, res) => {
    getPicture(req, res)
})

export default router;
