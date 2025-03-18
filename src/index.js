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

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    static getInGameCount() {
        return this._inGameCount || 0;
    }

    static setInGameCount(value) {
        this._inGameCount = Math.max(value, 0);
    }

    static getBonus() {
        const count = this.getInGameCount();
        return count * (count + 1) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        super.doAfterComingIntoPlay?.(gameContext, continuation);
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation?.();
    }

    doBeforeRemoving(gameContext, continuation) {
        super.doBeforeRemoving?.(gameContext, continuation);
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation?.();
    }

    modifyDealedDamageToCreature(damage, toCard, gameContext, continuation) {
        const modifiedDamage = damage + Lad.getBonus();
        continuation?.(modifiedDamage);
        return modifiedDamage;
    }

    modifyTakenDamage(damage, fromCard, gameContext, continuation) {
        const bonus = Lad.getBonus();
        const modifiedDamage = Math.max(damage - bonus, 0);

        if (modifiedDamage > 0) {
            return super.modifyTakenDamage(modifiedDamage, fromCard, gameContext, continuation);
        } else {
            continuation(0);
            return 0;
        }
    }

    getDescriptions() {
        const descriptions = super.getDescriptions();
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature')) {
            descriptions.unshift('Чем их больше, тем они сильнее');
        }
        return descriptions;
    }
}

class Rogue extends Creature {
    constructor() {
        super('Изгой', 2);
        this._stolenAbilities = new Map();
    }

    attack(gameContext, continuation) {
        const targetCard = gameContext.oppositePlayer.table[0];
        if (!targetCard) {
            continuation();
            return;
        }
const targetProto = Object.getPrototypeOf(targetCard);
const abilities = ['modifyDealedDamageToCreature', 'modifyDealedDamageToPlayer', 'modifyTakenDamage'];

gameContext.oppositePlayer.table.forEach(card => {
    if (Object.getPrototypeOf(card) === targetProto) {
        abilities.forEach(ability => {
            if (targetProto.hasOwnProperty(ability)) {
                if (!this._stolenAbilities.has(ability)) {
                    this._stolenAbilities.set(ability, targetProto[ability]);
                    this[ability] = targetProto[ability];
                }
                delete targetProto[ability];
            }
        });
    }
});

gameContext.updateView();

this.view.showAttack(() => {
    targetCard.takeDamage(this.power, this, gameContext, continuation);
});
}

getDescriptions() {
    return ['Крадет способности у всех существ одного типа', ...super.getDescriptions()];
}
}

class PseudoDuck extends Dog {
    constructor() {
        super('Псевдоутка', 3);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
//    new Rogue(),
];

const banditStartDeck = [
    new Lad(),
//    new PseudoDuck(),
    new Lad(),
];

function isDuck(card) {
    return card && card.quacks && card.swims;
}

function isDog(card) {
    return card instanceof Dog;
}

function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) return 'Утка-Собака';
    if (isDuck(card)) return 'Утка';
    if (isDog(card)) return 'Собака';
    return 'Существо';
}

const game = new Game(seriffStartDeck, banditStartDeck);
SpeedRate.set(1);
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});