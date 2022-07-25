const { Router } = require('express');
const controllers = require('../controllers');
const router = Router();

router.get('/', (req, res) => res.send('crapple maps root route'));

router.post('/users', controllers.createUser);

router.get('/users', controllers.getAllUsers);

router.get('/users/:id', controllers.getUserById);

router.put('/users/:id', controllers.updateUser);

router.delete('/users/:id', controllers.deleteUser);

router.post('/listings', controllers.createListing);

router.get('/listings', controllers.getAllListings);

router.get('/listings/:id', controllers.getListingById);

router.put('/listings/:id', controllers.updateListing);

router.delete('/listings/:id', controllers.deleteListing);

module.exports = router;