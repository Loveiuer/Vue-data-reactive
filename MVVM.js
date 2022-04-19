class MVVM {
    constructor(options = {}) {
        //一上来 先把可用的东西挂载到实例上
        this.$el = options.el
        if (typeof options.data == 'function') {
            this.$data = options.data()
        } else {
            this.$data = options.data
        }


        //如果有要编译的模板就开始编译
        if (this.$el) {
            //数据劫持
            new Observer(this.$data)
            //数据代理
            this.proxyData(this.$data)
            //用元素和数据进行编译
            new Compile(this.$el, this)
        }
    }
    proxyData(obj) {
        Object.keys(obj).forEach(key => {
            Object.defineProperty(this, key, {
                enumerable: true,
                configurable: true,
                get() {
                    return obj[key]
                },
                set(newValue) {
                    if (newValue !== obj[key]) {
                        obj[key] = newValue
                    }
                }
            })
        })
    }
}