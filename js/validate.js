'use strict';

import _ from 'lodash';


export function Invalid (message, stop=false) {
    this.name = 'Invalid';
    this.message = message;
    this.stop = stop;
    this.stack = Error(this.message).stack;  // http://es5.github.io/#x15.11.1
}

Invalid.prototype = Object.create(Error.prototype);
Invalid.prototype.constructor = Invalid;


export const Validate = {
    validate_init() {
        this.validators = _([
            this.options.validator, this.options.validators
        ]).flatten().filter().value();
    },

    /** validate one level of hierarchy
     * (node, transaction)
     */
    validate(node, transaction) {
        if (!('errors' in transaction)) {
            transaction.errors = {};
        }

        for(let validator of this.validators) {
            transaction.errors[validator.key] = null;

            // TODO implement path arg to invalidate children
            const setValid = function (valid, message) {
                transaction.errors[validator.key] = valid ? null : message;
            };

            const new_value = ('value' in transaction) ? transaction.value : node.value;

            try {
                validator.validate(new_value, setValid, this, node, transaction);
            } catch (ex) {
                if (!(ex instanceof Invalid)) {
                    throw ex;
                }

                transaction.errors[validator.key] = ex.message;

                if (ex.stop) {
                    break;
                }
            }
        }
    }
};
