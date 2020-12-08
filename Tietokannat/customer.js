const chai = require('chai');
const chaihttp = require('chai-http');
const app = require('../index');
const query = require('../db/customers');
const { getMaxListeners } = require('../index');
const should = chai.should();

chai.use(chaihttp);

const testCustomer = {
  firstname: 'test',
  lastname: 'person',
  email: 'test@test.com',
  phone: '04201421044'
}

describe('/POST customers', () => {
  beforeEach((done) => {
    query.deleteAllCustomers();
    done();
  });

  it('Add new customer', (done) => {
    chai.request(app)
      .post('/api/customers')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(testCustomer))
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.property('firstname');
        res.body.should.have.property('lastname');
        done();
       });
  });
});

describe('/GET customers', () => {
  it('Fetch all customers', (done) => {
    chai.request(app)
      .get('/api/customers')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a('array');
        res.body.length.should.be.eql(1);
        done();
    });
  });
});