#! /usr/bin/env node

const { default: axios } = require('axios');
const { Console, time } = require('console');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'enter command > '
});

readline.prompt();

readline.on('line', async line => {

    switch (line.trim()) {
        
        case 'list vegan foods': {
            console.log('vegan food list:');
            const {data} = await axios.get(`http://localhost:3001/food`);

            // genrator 
            function* listVeganFoods() {
                try {
                    let idx = 0;
                    const veganOnly = data.filter(food => 
                        food.dietary_preferences.includes('vegan')
                    );
    
                    while(veganOnly[idx]) {
                        yield veganOnly[idx];
                        idx++;
                    }

                } catch (error) {
                    console.log('Something went wrong while listing vegan items', {error});
                }
            }
                
                // custom iterator

                // const veganIterable = {
                //     [Symbol.iterator]() {
                //         return {
                //             [Symbol.iterator]() {return this;},
                //             next() {
                //                 const current = veganOnly[idx];
                //                 idx++;
                //                 if (current) {
                //                     return {value: current, done: false};
                //                 } else {
                //                     return {value: current, done: true};
                //                 }
                //             },
                //         };
                //     },
                // };


                // for (let val of veganIterable) {
                //     console.log(val.name);
                // }

            for (let val of listVeganFoods()) {
                console.log(val.name);
            }

            readline.prompt();

        }
        break;
        
        case 'log' : {
            const { data } = await axios.get(`http://localhost:3001/food`);
            const it = data[Symbol.iterator]();
            let actionIt;

            // custon iterator

            // const actionIterator = {
            //     [Symbol.iterator]() {
            //         let positions = [...this.actions];
            //         return {
            //             [Symbol.iterator]() {
            //                 return this;
            //             },
            //             next(...args) {
            //                 if (positions.length > 0) {
            //                     const position = positions.shift();
            //                     const result = position(...args);
            //                     return {value: result, done: false};
            //                 } else {
            //                     return { done: true };
            //                 }
            //             },
            //             return() {
            //                 positions = [];
            //                 return {done: true};
            //             },
            //             throw(error) {
            //                 console.log(error);
            //                 return {value: undefined, done: true};
            //             },
            //         };
            //     },
            //     actions: [askForServingSize, displayCalories],
            // };

            // genrator

            function* actionGenreator() {
                try {
                    const food = yield;
                    const servingSize = yield askForServingSize();
                    yield displayCalories(servingSize, food);
                } catch (error) {
                    console.log({error});
                }
            }

            function askForServingSize(food) {
                readline.question(
                    "How many servings did you eat? (as a decimal: 1, 0.5, 1.25, etc...) or type 'nevermind' or 'n' if you don't wannna answer this question.",
                    servingSize => {
                        if (servingSize === 'nevermind' || servingSize === 'n') {
                            actionIt.return();
                        } else if (typeof servingSize !== 'number' || servingSize === NaN) {
                            actionIt.throw('Please, number only');
                        } else {
                            actionIt.next(servingSize, food);
                        }
                    }
                );  
            }

            async function displayCalories(servingSize = 1, food) {
                const calories = food.calories;
                console.log(`${food.name} with a serving size of ${servingSize} 
                        has a ${Number.parseFloat(calories * parseInt(servingSize, 10), ).toFixed()} calories.`);
                const {data} = await axios.get('http://localhost:3001/users/1');
                const usersLog = data.log || [];
                const putBody = {
                    ...data,
                    log: [
                        ...usersLog,
                        {
                            [Date.now()]: {
                                food: food.name,
                                servingSize,
                                calories: Number.parseFloat(calories * parseInt(servingSize, 10), )
                            }
                        }
                    ],
                }
                await axios.put('http://localhost:3001/users/1', putBody, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                actionIt.next();
                readline.prompt();
            }
            
            readline.question('What would you like to log?', async (item) => {
                let position = it.next();
                while(!position.done) {
                    const food = position.value.name;
                    if (food === item) {
                        console.log(`${item} has ${position.value.calories} calories.`);

                        // for iterator :
                        // actionIt = actionIterator[Symbol.iterator]();
                        // actionIt.next(position.value);

                        // for generator :

                        actionIt = actionGenreator();
                        actionIt.next();
                        actionIt.next(position.value);
                    }
                    position = it.next();
                }
                readline.prompt();
            });
        }
        break; 

        case 'today log': {
            readline.question('Email: ', async emailAddress => {
                const {data} = await axios.get(`http://localhost:3001/users?email=${emailAddress}`);
                
                const foodLog = data[0].log || [];
                let totalCalories = 0;

                function* getFoodLog() {
                    try {
                        yield* foodLog;
                    } catch (error) {
                        console.log('Error reading the log', {error});
                    }             
                }

                const logIterator = getFoodLog();
                for (const entry of logIterator) {
                    const timestamp = Object.keys(entry)[0];
                    if (isToday(new Date(Number(timestamp)))) {
                        console.log(`${entry[timestamp].food}, ${entry[timestamp].servingSize} serving(s)`);
                        totalCalories += entry[timestamp].calories;
                        if (totalCalories >= 12000) {
                            console.log(`Impressive how much you've eaten!`);
                            logIterator.return();
                        };
                    };
                }
                console.log('------------');
                console.log(`Total calories: ${totalCalories}`);
                readline.prompt();
            });
        }
        break;
        
    }
    readline.prompt();
});

function isToday(timestamp) {
    const today = new Date();
    return (
        timestamp.getDate() === today.getDate() &&
        timestamp.getMonth() === today.getMonth() &&
        timestamp.getFullYear() === today.getFullYear()
    )
}


