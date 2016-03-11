'use strict';


describe("validator tests", function() {
    jest.dontMock('../js/validate');

    const _ = require('lodash');
    const { Validate, Invalid } = require('../js/validate');

    describe("Validate", function () {
        const X = function (options) {
            this.options = _.assign({}, options);
            this.validate_init();
        };

        _.assign(X.prototype, Validate);

        it("calls validators with correct args", function () {
            const validators = [{
                key: 'validator0',
                validate: jest.genMockFunction()
            }, {
                key: 'validator1',
                validate: jest.genMockFunction()
            }, {
                key: 'validator2',
                validate: jest.genMockFunction()
            }];

            const schema_node = new X({
                validator: validators[0],
                validators: [validators[1], validators[2]]
            });

            const node = {value: 42};
            const transaction = {};
            schema_node.validate(node, transaction);

            for(let v of validators) {
                expect(v.validate.mock.calls.length).toBe(1);

                const args = v.validate.mock.calls[0];

                expect(args[0]).toBe(42);
                expect(args[2]).toBe(schema_node);
                expect(args[3]).toBe(node);
                expect(args[4]).toBe(transaction);
            }
        });

        it("stores validation results in transaction", function () {
            const validators = [{
                key: 'validator0',
                validate: function () {}
            }, {
                key: 'validator1',
                validate: function () {
                    throw new Invalid('validator1 Invalid');
                }
            }, {
                key: 'validator2',
                validate: function (new_value, setValid) {
                    setValid(false, 'validator2 message');
                }
            }, {
                key: 'validator3',
                validate: function (new_value, setValid) {
                    setValid(true, 'validator3 message');
                }
            }];

            const schema_node = new X({
                validators: validators
            });

            const node = {value: 42};
            const transaction = {};
            schema_node.validate(node, transaction);

            expect(transaction.errors.validator0).toBe(null);
            expect(transaction.errors.validator1).toEqual('validator1 Invalid');
            expect(transaction.errors.validator2).toBe('validator2 message');
            expect(transaction.errors.validator3).toBe(null);
        });
    });
});
