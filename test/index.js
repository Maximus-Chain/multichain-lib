/* eslint-disable */
// TODO: Remove previous line and work through linting issues at next edit

'use strict';

var should = require('chai').should();
var sinon = require('sinon');
var multichain = require('./_setup').multichain;

describe('#versionGuard', function () {
  it('global._multichain should be defined', function () {
    should.equal(global._multichain, multichain.version);
  });

  it('throw a warning if version is already defined', function () {
    sinon.stub(console, 'warn');
    multichain.versionGuard('version');
    should.equal(console.warn.calledOnce, true);
    should.equal(
      console.warn.calledWith(
        'More than one instance of multichain-lib found. Please make sure that you are not mixing instances of classes of different versions of multichain-lib.'
      ),
      true
    );
  });
});