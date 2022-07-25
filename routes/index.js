const { Router } = require('express');
const controllers = require('../controllers');
const router = Router();

router.get('/', (req, res) => res.send('crapple maps root route'));

router.post('/users', controllers.createUser);

router.get('/users', controllers.getAllUsers);

router.put('/users', controllers.updateUser);

router.post('/listings', controllers.createListing);

router.get('/listings', controllers.getAllListings);

router.get('/listings/:id', controllers.getListingById);

router.put('/listings/:id', controllers.updateListing);

router.delete('/listings/:id', controllers.deleteListing);

module.exports = router;