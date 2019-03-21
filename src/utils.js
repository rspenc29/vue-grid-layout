
/**
 * Given a layout, compact it. This involves going down each y coordinate and removing gaps between items.
 */
export function compact(layout, compactType, cols) {
    let compareWith = getStatics(layout),
        sorted = sortLayoutItems(layout, compactType),
        out = Array(layout.length),
        i, len, l;

    for (i = 0, len = sorted.length; i < len; i++) {
        l = cloneLayoutItem(sorted[i]);

        if (!l.static) {
            l = compactItem(compareWith, l, compactType, cols, sorted);
            compareWith.push(l);
        }

        out[layout.indexOf(sorted[i])] = l;
        l.moved = false;
    }
    return out;
}

/**
 * Get all static elements.
 */
export function getStatics(layout) {
    return layout.filter(l => l.static);
}

/**
 * Get layout items sorted from top left to right and down.
 */
export function sortLayoutItems(layout, compactType) {
    return (compactType === 'horizontal')
        ? sortLayoutItemsByColRow(layout)
        : sortLayoutItemsByRowCol(layout);
}

export function sortLayoutItemsByRowCol(layout) {
    return [].concat(layout).sort((a, b) => {
        if (a.y > b.y || (a.y === b.y && a.x > b.x)) return 1;
        else if (a.y === b.y && a.x === b.x) return 0;
        return -1;
    });
}

export function sortLayoutItemsByColRow(layout) {
    return [].concat(layout).sort((a, b) => {
        return (a.x > b.x || (a.x === b.x && a.y > b.y)) ? 1 : -1;
    });
}

export function cloneLayoutItem(item) {
    return {
        w: item.w,
        h: item.h,
        x: item.x,
        y: item.y,
        i: item.i,
        moved: Boolean(item.moved),
    };
}

/**
 * Compact an item in the layout.
 */
export function compactItem(compareWith, l, compactType, cols, fullLayout) {
    const compactH = compactType === 'horizontal';

    if (compactType === 'vertical') {
        l.y = Math.min(bottom(compareWith), l.y);
        while (l.y > 0 && !getFirstCollision(compareWith, l)) {
            l.y--;
        }
    } else if (compactH) {
        l.y = Math.min(bottom(compareWith), l.y);
        while (l.x > 0 && !getFirstCollision(compareWith, l)) {
            l.x--;
        }
    }

    let collides;
    while ((collides = getFirstCollision(compareWith, l))) {
        if (compactH) {
            resolveCompactionCollision(fullLayout, l, collides.x + collides.w, 'x');
        } else {
            resolveCompactionCollision(fullLayout, l, collides.y + collides.h, 'y');
        }
        if (compactH && l.x + l.w > cols) {
            l.x = cols - l.w;
            l.y++;
        }
    }
    return l;
}

/**
 * Return the bottom coordinate of the layout.
 */
export function bottom(layout) {
    let max = 0, bottomY;

    for (let i = 0, len = layout.length; i < len; i++) {
        bottomY = layout[i].y + layout[i].h;
        if (bottomY > max) max = bottomY;
    }
    return max;
}

/**
 * Returns the first item this layout collides with.
 * It doesn't appear to matter which order we approach this from, although
 * perhaps that is the wrong thing to do.
 */
export function getFirstCollision(layout, layoutItem) {
    for (let i = 0, len = layout.length; i < len; i++) {
        if (collides(layout[i], layoutItem)) return layout[i];
    }
}

/**
 * Before moving item down, it will check if the movement will cause collisions and move those items down before.
 */
export function resolveCompactionCollision(layout, item, moveToCoord, axis) {
    const heightWidth = { x: 'w', y: 'h' };
    const sizeProp = heightWidth[axis];

    item[axis] += 1;
    const itemIndex = layout.map(layoutItem => layoutItem.i).indexOf(item.i);

    for (let i = itemIndex + 1; i < layout.length; i++) {
        const otherItem = layout[i];
        if (otherItem.static) continue;
        if (otherItem.y > (item.y + item.h)) break;

        if (collides(item, otherItem)) {
            resolveCompactionCollision(layout, otherItem, moveToCoord + item[sizeProp], axis);
        }
    }
    item[axis] = moveToCoord;
}

/**
 * Given two layoutitems, check if they collide.
 */
export function collides(l1, l2) {
    if (l1.i === l2.i) return false; // same element
    if (l1.x + l1.w <= l2.x) return false; // l1 is left of l2
    if (l1.x >= l2.x + l2.w) return false; // l1 is right of l2
    if (l1.y + l1.h <= l2.y) return false; // l1 is above l2
    if (l1.y >= l2.y + l2.h) return false; // l1 is below l2
    return true; // boxes overlap
}

/**
 * Generate a layout using the initialLayout and children as a template.
 */
export function syncLayoutWithChildren(initialLayout, children, cols, compactType) {
    initialLayout = initialLayout || [];
    let layout = [];

    children.forEach((child, i) => {
        let item = (child.data.attrs && child.data.attrs.layout)
            ? child.data.attrs.layout
            : getLayoutItem(initialLayout, String(child.key));
        if (!item) throw 'Cant find item layout.';
        layout[i] = cloneLayoutItem(item);
    });

    layout = correctBounds(layout, { cols: cols });
    layout = compact(layout, compactType, cols);
    return layout;
}

/**
 * Get a layout item by ID. Used so we can override later on if necessary.
 */
export function getLayoutItem(layout, id) {
    for (let i = 0, len = layout.length; i < len; i++) {
        if (layout[i].i == id) return layout[i];
    }
}

/**
 * Given a layout, make sure all elements fit within its bounds.
 */
export function correctBounds(layout, bounds) {
    const collidesWith = getStatics(layout);
    for (let i = 0, len = layout.length; i < len; i++) {
        const l = layout[i];

        if (l.x + l.w > bounds.cols) {
            l.x = bounds.cols - l.w;
        }

        if (l.x < 0) {
            l.x = 0;
            l.w = bounds.cols;
        }

        if (!l.static) {
            collidesWith.push(l);
        } else {
            while (getFirstCollision(collidesWith, l)) {
                l.y++;
            }
        }
    }
    return layout;
}

export function getAllCollisions(layout, layoutItem) {
    return layout.filter(l => collides(l, layoutItem));
}

/**
 * Move an element. Responsible for doing cascading movements of other elements.
 */
export function moveElement(layout, l, x, y, isUserAction, preventCollision, compactType, cols) {
    if (l.static) return layout;
    if (l.y === y && l.x === x) return layout;
    const oldX = l.x, oldY = l.y;

    if (typeof x === 'number') l.x = x;
    if (typeof y === 'number') l.y = y;
    l.moved = true;

    let sorted = sortLayoutItems(layout, compactType);
    const movingUp = (compactType === "vertical" && typeof y === 'number')
        ? oldY >= y
        : (compactType === "horizontal" && typeof x === 'number') ? oldX >= x : false;
    if (movingUp) sorted = sorted.reverse();
    const collisions = getAllCollisions(sorted, l);

    if (preventCollision && collisions.length) {
        l.x = oldX;
        l.y = oldY;
        l.moved = false;
        return layout;
    }

    for (let i = 0, len = collisions.length; i < len; i++) {
        let collision = collisions[i];
        if (collision.moved) continue;

        if (collision.static) {
            layout = moveElementAwayFromCollision(layout, collision, l, isUserAction, compactType, cols);
        } else {
            layout = moveElementAwayFromCollision(layout, l, collision, isUserAction, compactType, cols);
        }
    }

    return layout;
}

/**
 * This is where the magic needs to happen - given a collision, move an element away from the collision.
 * We attempt to move it up if there's room, otherwise it goes below.
 */
export function moveElementAwayFromCollision(layout, collidesWith, itemToMove, isUserAction, compactType, cols) {
    const compactH = compactType === 'horizontal';
    const compactV = compactType !== 'horizontal';
    const preventCollision = false;

    if (isUserAction) {
        isUserAction = false;

        const fakeItem = {
            x: compactH ? Math.max(collidesWith.x - itemToMove.w, 0) : itemToMove.x,
            y: compactV ? Math.max(collidesWith.y - itemToMove.h, 0) : itemToMove.y,
            w: itemToMove.w,
            h: itemToMove.h,
            i: '-1',
        };

        if (!getFirstCollision(layout, fakeItem)) {
            let x = compactH ? fakeItem.x : undefined,
                y = compactV ? fakeItem.y : undefined;

            return moveElement(layout, itemToMove, x, y, isUserAction, preventCollision, compactType, cols);
        }
    }

    let x = compactH ? itemToMove.x + 1 : undefined,
        y = compactV ? itemToMove.y + 1 : undefined;

    return moveElement(layout, itemToMove, x, y, isUserAction, preventCollision, compactType, cols);
}

export function debounce(func, wait, immediate) {
    let timeout;

    return function() {
        let later = () => {
            timeout = null;
            if (!immediate) func.apply(this, arguments);
        };

        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, arguments);
    };
}

