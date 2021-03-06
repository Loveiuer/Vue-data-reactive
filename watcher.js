//观察者的目的就是给需要变化的那个元素添加一个观察者，当数据变化后执行对应的方法
class Watcher {
    constructor(vm, expr, cb) {
        this.vm = vm
        this.expr = expr
        this.cb = cb
        //先获取一下老值
        this.value = this.getOldVal()
        console.log('添加了一个watch');
    }
    getVal(vm, expr) {  //获取实例上对应的数据
        let segments = expr.split('.')
        return segments.reduce((pre, cur) => {
            return pre[cur]
        }, vm.$data)
    }
    getOldVal() {
        Dep.target = this
        let value = this.getVal(this.vm, this.expr)
        Dep.target = null
        return value
    }
    //对外暴露的方法
    update() {
        let newValue = this.getVal(this.vm, this.expr)
        let oldValue = this.value
        if (newValue !== oldValue) {
            this.cb(newValue)  //对应watch的callback
        }
    }
}

// 用新值和老值进行对比 如果发生变化 就调用更新方法
// Vue.$watch(vm, 'a', function () { })