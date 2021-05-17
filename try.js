const func1 = () => console.log('1');
const func2 = () => console.log('2');

const actionIterator = {
    [Symbol.iterator]() {
        let positions = [...this.actions];
        return {
            [Symbol.iterator]() {
                return this;
            },
            next(...args) {
                if (positions.length > 0) {
                    const position = positions.shift();
                    const result = position(...args);
                    return {value: result, done: false};
                } else {
                    return { done: true };
                }
            },
            return () {
                position = [];
                return {done: true};
            },
            throw (error) {
                console.log(error);
                return {value: undefined, done: true};
            },
        };
    },
    actions: [func1, func2],
};

console.log(actionIterator);
console.log(actionIterator[Symbol.iterator]());

