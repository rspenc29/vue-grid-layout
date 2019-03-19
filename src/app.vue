
<template>
    <div class="demo">
        <h3>Vue-Grid-Layout Demo 1 - Responsive</h3>

        <div class="controls">
            <label>
                Row Height: <input type="number" v-model.number="rowHeight" style="width: 50px" min="5">
            </label>
            <label>
                Margin:
                <input type="number" v-model.number="margin[0]" style="width: 30px">
                <input type="number" v-model.number="margin[1]" style="width: 30px">
            </label>
            <label>
                Columns:
                <label v-for="(v, k) in columns" :key="k">
                    {{ k }}: <input type="number" v-model.number="columns[k]" style="width: 30px">
                </label>
            </label>
            <label>
                Breakpoints:
                <label v-for="(v, k) in breakpoints" :key="k">
                    {{ k }}: <input type="number" v-model.number="breakpoints[k]" style="width: 50px">
                </label>
            </label>
        </div>

        <div class="layout">
            <div class="columns">
                <div v-for="item in layout" :key="item.i">
                    <b>{{ item.i }}:</b> [ {{ item.x }}, {{ item.y }}, {{ item.w }}, {{ item.h }} ]
                </div>
            </div>
        </div>

        <responsive-grid-layout
            v-if="layout"
            :layouts="layouts"
            :margin="margin"
            :rowHeight="rowHeight"
            :columns="columns"
            :breakpoints="breakpoints"
            @layout-changed="onLayoutChange"
            @item-resized="onItemResized">

            <div v-for="(l, i) in layout" :key="i">
                <span class="text">{{ i }}</span>
            </div>
        </responsive-grid-layout>
    </div>
</template>

<script>
import responsiveGridLayout from './components/responsiveGridLayout';

export default {
    components: { responsiveGridLayout },
    data: () => ({
        layouts: {},
        margin: [10, 10],
        rowHeight: 50,
        breakpoints: { xl: 1200, lg: 992, md: 768, sm: 576, xs: 0 },
        columns: { xl: 12, lg: 9, md: 6, sm: 4, xs: 3 },
        breakpoint: 'xl',
    }),
    created() {
        this.$set(this.layouts, 'xl', this.generateLayout());
    },
    mounted() {
        this.pageWidth = this.$el.offsetWidth;
    },
    computed: {
        layout() {
            return this.layouts[this.breakpoint];
        },
    },
    methods: {
        generateLayout() {
            let items = [], i, y;

            for (i = 0; i < 25; i++) {
                y = Math.ceil(Math.random() * 4) + 1;
                items.push({
                    x: (i * 2) % 12,
                    y: Math.floor(i / 6) * y,
                    w: 2,
                    h: y,
                    i: i.toString(),
                });
            }
            return items;
        },
        onLayoutChange(layout, breakpoint) {
            this.$set(this.layouts, breakpoint, layout);
            this.breakpoint = breakpoint;
        },
        onItemResized(event) {
            console.log('onItemResized', { event });
        },
    },
};
</script>

<style>
.vue-grid-layout {
    background: #eee;
}

.vue-grid-layout > .grid-item {
    background: #ccc;
    border: 1px solid black;
}

.vue-grid-layout > .grid-item .text {
    font-size: 24px;
    text-align: center;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
    height: 24px;
}

.layout {
    background: #ddd;
    border: 1px solid black;
    margin-top: 10px;
    padding: 10px;
}

.columns {
    -moz-columns: 120px;
    -webkit-columns: 120px;
    columns: 120px;
}
</style>

<style scoped>
.controls > label { display: inline-block; margin: 0 5px; }
</style>

