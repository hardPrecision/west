import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card {
    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()];
    }
}

class Duck extends Creature {
    constructor() {
        super('Мирная утка', 2);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor(name = 'Пес-бандит', power = 3) {
        super(name, power);
    }
}

class Trasher extends Dog {
    constructor() {
        super('Громила', 5);
    }

    modifyTakenDamage(damage, fromCard, gameContext, continuation) {
        const reducedDamage = Math.max(damage - 1, 0);
        this.view.signalAbility(() => {
            super.modifyTakenDamage(reducedDamage, fromCard, gameContext, continuation);
        });
    }

    getDescriptions() {
        return ['Получает на 1 меньше урона при атаке', ...super.getDescriptions()];
    }
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const { oppositePlayer } = gameContext;

        oppositePlayer.table.forEach(card => {
            taskQueue.push(continuation => {
                this.view.showAttack();
                card.takeDamage(2, this, gameContext, continuation);
            });
        });

        taskQueue.continueWith(continuation);
    }

    getDescriptions() {
        return ['Атакует всех врагов по очереди с уроном 2', ...super.getDescriptions()];
    }
}

const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Gatling(),
];

const banditStartDeck = [
    new Trasher(),
    new Dog(),
    new Dog(),
];

function isDuck(card) {
    return card && card.quacks && card.swims;
}

function isDog(card) {
    return card instanceof Dog;
}

function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

const game = new Game(seriffStartDeck, banditStartDeck);
SpeedRate.set(1);
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});