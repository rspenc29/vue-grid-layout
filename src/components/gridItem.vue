
<script>
import VueDraggableResizable from 'vue-draggable-resizable';

export default {
    components: { VueDraggableResizable },
    props: {
        colWidth: { type: Number, required: true },
        rowHeight: { type: Number, default: 20 },
        margin: { type: Array, default: () => ([10, 10]) },
        maxRows: { type: Number, default: Infinity },
        cols: { type: Number, default: 12 },
        value: { type: Object, required: true }, // { x, y, w, h } in grid units
        isDraggable: { type: Boolean, default: false },
        isResizable: { type: Boolean, default: false },
        isPlaceholder: { type: Boolean, default: false },
    },
    data: () => ({ state: { dragging: null, resizing: null } }),
    render(h) {
        let context = {
            props: {
                ...this.position,
                className: 'grid-item',
                draggable: !this.isPlaceholder && this.isDraggable,
                resizable: !this.isPlaceholder && this.isResizable,
                active: !this.isPlaceholder && this.isResizable,
                preventDeactivation: !this.isPlaceholder && this.isResizable,
                handles: this.isResizable ? ['br'] : [],
                onDragStart: this.onDragStart,
                onResizeStart: this.onResizeStart,
                class: this.class,
            },
        };

        if (!this.isPlaceholder) {
            context.on = {
                dragging: this.onDrag,
                resizing: this.onResize,
                dragstop: this.onDragStop,
                resizestop: this.onResizeStop,
            };
        }

        return h(VueDraggableResizable, context, [this.$slots.default]);
    },
    computed: {
        /**
         * Convert position from grid coordinates to pixels.
         */
        position() {
            const out = {};

            if (this.state.resizing) {
                out.w = Math.round(this.state.resizing.w);
                out.h = Math.round(this.state.resizing.h);
            } else {
                let { w, h } = this.value;
                out.w = (w === Infinity) ? w : Math.round(this.colWidth * w + Math.max(0, w - 1) * this.margin[0]);
                out.h = (h === Infinity) ? h : Math.round(this.rowHeight * h + Math.max(0, h - 1) * this.margin[1]);
            }

            if (this.state.dragging) {
                out.x = Math.round(this.state.dragging.x);
                out.y = Math.round(this.state.dragging.y);
            } else {
                let { x, y } = this.value;
                out.x = Math.round((this.colWidth + this.margin[0]) * x) + this.margin[0];
                out.y = Math.round((this.rowHeight + this.margin[1]) * y) + this.margin[1];
            }

            return out;
        },
    },
    methods: {
        onDragStart() {
            let parent = this.$parent.$el,
                parentRect = parent.getBoundingClientRect(),
                clientRect = this.$el.getBoundingClientRect();

            this.state.dragging = {
                x: clientRect.left - parentRect.left + parent.scrollLeft,
                y: clientRect.top - parentRect.top + parent.scrollTop,
            };

            this.$emit('dragstart', this.$vnode.key, this.value);
        },
        onDrag(x, y) {
            let newPos = { x, y };
            this.state.dragging = newPos;
            this.$emit('dragging', this.$vnode.key, this.value, this.calcXY(newPos.x, newPos.y));
        },
        onDragStop(/*x, y*/) {
            let newPos = { ...this.state.dragging };
            this.state.dragging = null;
            let { x, y } = this.calcXY(newPos.x, newPos.y)
            this.$emit('dragstop', this.$vnode.key, this.value, x, y);
            //this.$emit('input', { ...this.value, x, y });
        },
        onResizeStart() {
            this.state.resizing = this.position;
            this.$emit('resizestart', this.$vnode.key, this.value);
        },
        onResize(dx, dy, dw, dh) {
            let { w, h } = this.calcWH(dw, dh),
                { x } = this.calcXY(dx, dy);

            w = Math.min(w, this.cols - x);
            w = Math.max(w, 1);
            this.state.resizing = { w: dw, h: dh };
            this.$emit('resizing', this.$vnode.key, this.value, { w, h });
        },

        onResizeStop(dx, dy, dw, dh) {
            let { w } = this.calcWH(dw, dh),
                { x } = this.calcXY(dx, dy);

            w = Math.min(w, this.cols - x);
            w = Math.max(w, 1);
            this.state.resizing = null;

            this.$emit('resizestop', this.$vnode.key, this.value, {
                left: this.position.x,
                top: this.position.y,
                width: this.position.w,
                height: this.position.h,
            });
            //this.$emit('input', { ...this.value, w, h });
        },

        /**
         * Convert from pixels to grid coordinates.
         */
        calcCoords() {
            let { x, y, w, h } = this.position;
            return { ...this.calcXY(x, y), ...this.calcWH(w, h) };
        },

        /**
         * Translate x and y coordinates from pixels to grid units.
         */
        calcXY(left, top) {
            let x = Math.round((left - this.margin[0]) / (this.colWidth + this.margin[0])),
                y = Math.round((top - this.margin[1]) / (this.rowHeight + this.margin[1]));
            x = Math.max(Math.min(x, this.cols - this.value.w), 0);
            y = Math.max(Math.min(y, this.maxRows - this.value.h), 0);
            return { x, y };
        },

        /**
         * Translate w and h dimensions from pixels grid units.
         */
        calcWH(width, height) {
            let w = Math.round((width + this.margin[0]) / (this.colWidth + this.margin[0])),
                h = Math.round((height + this.margin[1]) / (this.rowHeight + this.margin[1]));
            w = Math.max(Math.min(w, this.cols - this.value.x), 0);
            h = Math.max(Math.min(h, this.maxRows - this.value.y), 0);
            return { w, h };
        },
    },
}
</script>

<style>
.vue-grid-layout > .grid-item {
    transition: all 100ms ease;
    box-sizing: border-box;
}

.vue-grid-layout > .grid-item.dragging {
    transition: none;
}

.vue-grid-layout > .grid-item.resizing {
    opacity: 0.9;
}

.vue-grid-layout > .grid-item > .handle.handle-br {
    position: absolute;
    width: 20px;
    height: 20px;
    bottom: 0;
    right: 0;
    cursor: se-resize;
    z-index: 10;
}

.vue-grid-layout > .grid-item > .handle.handle-br:after {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 5px;
    height: 5px;
    border-right: 2px solid rgba(0, 0, 0, 0.4);
    border-bottom: 2px solid rgba(0, 0, 0, 0.4);
}

.vue-grid-layout > .grid-item.placeholder {
    transition-duration: 50ms;
    background: red;
    opacity: 0.2;
    border: none;
}
</style>

