class Observer {
    constructor(obj) {
        this.observe(obj)
    }
    observe(obj) { //把obj原来的属性改成set get 形式
        if (typeof obj !== 'object' || obj == null) {
            return
        }
        if (Array.isArray(obj)) { //处理数组
            //改变数组的原型链
            const newArrayProto = this.changeArrayProto()
            Object.setPrototypeOf(obj, newArrayProto)
            this.observerArray(obj)
        } else {
            //将数据一一劫持
            const keys = Object.keys(obj)
            keys.forEach(key => {
                //劫持
                this.defineReactive(obj, key, obj[key])
                this.observe(obj[key])  //深度递归劫持
            });
        }
    }
    //改写数组原型方法
    changeArrayProto() {
        let that = this
        const arrayProto = Array.prototype
        const newArrayProto = Object.create(arrayProto)
        //重写原型链上的push unshift splice方法
        const methods = ['push', 'unshift', 'splice']
        methods.forEach(method => {
            newArrayProto[method] = function (...args) {
                let inserted
                //调用原来的数组方法
                switch (method) {
                    case 'push':
                    case 'unshift':
                        inserted = args
                        break
                    case 'splice':
                        inserted = args.slice(2)
                }
                arrayProto[method].apply(this, inserted)
                //给新加入的元素做数据劫持
                that.observerArray(args)
            }
        });
        return newArrayProto
    }
    //给数组中元素添加响应式
    observerArray(arr) {
        for (let i = 0; i < arr.length; i++) {
            this.observe(arr[i])
        }
    }
    //定义响应式
    defineReactive(obj, key, value) {
        let that = this
        let dep = new Dep() //每个变化的数据 都会对应一个数组，这个数组是存放所有更新的操作
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set(newValue) {
                if (newValue !== value) {
                    //这里的this不是实例 是vm.$data   vm.$data.person ={}
                    that.observe(newValue) //如果是对象 继续劫持
                    value = newValue
                    dep.notify() //通知所有人 数据更新了
                }
            }
        })
    }
}

class Dep {
    constructor() {
        //订阅的数组
        this.subs = []
    }
    addSub(watcher) { //添加订阅
        this.subs.push(watcher)
    }
    notify() { //发布消息
        this.subs.forEach(watcher => { watcher.update() })
    }
}