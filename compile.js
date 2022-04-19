class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el)
        this.vm = vm

        if (this.el) { //如果这个元素能获取到 我们才开始编译
            //1、先把这些真实的DOM移入到内存中 即文档碎片fragment
            let fragment = this.node2fragment(this.el)
            //2、编译 => 提取想要的元素节点v-xxx 和 文本节点{{ }}
            this.compile(fragment)
            //3、把编译好的fragment塞回到页面
            this.el.appendChild(fragment)
        }
    }
    /* 专门写一下辅助的方法 */
    //判断一个DOM节点是不是元素节点
    isElementNode(node) {
        return node.nodeType == 1
    }
    //判断是不是指令
    isDirective(name) {
        return name.includes('v-')
    }

    /* 核心方法 */
    //编译元素节点 v-xxx
    compileElement(node) {
        let attrs = node.attributes //取出当前节点的属性
        for (let attr of attrs) {
            //判断属性名是不是包含v-
            let attrName = attr.name //取出属性名
            if (this.isDirective(attrName)) {
                //取到对应的值放到节点中
                let expr = attr.value
                //node this.vm.$data expr:v-xxx
                // let type = attrName.slice(2)
                let [, type] = attrName.split('-')  //高逼格
                CompileUtil[type](node, this.vm, expr)
            }
        }
    }
    //编译文本节点 {{ }}
    compileText(node) {
        let text = node.nodeValue //取出文本节点的内容
        let reg = /\{\{([^}]+)\}\}/g
        if (reg.test(text)) {
            // node this.vm.$data text
            CompileUtil.text(node, this.vm, text)
        }
    }
    //编译
    compile(fragment) {
        //需要递归
        const childNodes = fragment.childNodes //childNodes是第一层的子节点
        Array.from(childNodes).forEach(node => {
            if (this.isElementNode(node)) {
                //是元素节点,需要深入检查
                // 这里需要编译元素
                this.compileElement(node)
                this.compile(node)
            } else {
                //文本节点
                //这里需要编译文本
                this.compileText(node)
            }
        });
    }
    //先把这些真实的DOM移入到内存中
    node2fragment(el) {
        const fragment = document.createDocumentFragment()
        let firstChild
        while (firstChild = el.firstChild) {
            fragment.appendChild(firstChild)
        }
        return fragment //内存中的节点
    }

}


CompileUtil = {
    getVal(vm, expr) {  //获取实例上对应的数据 person.age => 18
        let segments = expr.split('.')
        return segments.reduce((pre, cur) => {
            return pre[cur]
        }, vm.$data)
        /* return (obj) => {
            for (let i = 0; i < segments.length; i++){
                obj = obj[segments[i]]
            }
            return obj
        } */
    },
    setVal(vm, expr, value) { //如果是输入框 把输入的值赋给vm.$data
        let segments = expr.split('.')
        segments.reduce((pre, cur, index) => {
            if (index == segments.length - 1) {
                return pre[cur] = value
            }
            return pre[cur]
        }, vm.$data)
    },
    getTextVal(vm, text) {  //获取编译文本后的结果 {{a}} {{b}} => 100 200
        return text.replace(/\{\{([^}]+)\}\}/g, (...args) => {
            return this.getVal(vm, args[1])
        })
    },
    text(node, vm, text) { //文本处理
        //text {{message}}
        let value = this.getTextVal(vm, text)
        const updateFn = this.updater['textUpdater']
        text.replace(/\{\{([^}]+)\}\}/g, (...args) => {
            new Watcher(vm, args[1], (newValue) => {
                //如果数据变化了，文本节点需要重新获取依赖的属性更新文本中的内容
                updateFn && updateFn(node, this.getTextVal(vm, text))
            })
        })
        updateFn && updateFn(node, value)
    },
    model(node, vm, expr) {  //输入框处理
        const updateFn = this.updater['modelUpdater']
        //这里应该加一个监控，数据变化了，应该调用这个watch的callback
        new Watcher(vm, expr, (newValue) => {
            //当值变化后 会调用cb 将新值传递过来
            updateFn && updateFn(node, this.getVal(vm, expr))
        })
        node.addEventListener('input', (e) => {
            let newValue = e.target.value
            console.log(newValue);
            this.setVal(vm, expr, newValue)
        })
        updateFn && updateFn(node, this.getVal(vm, expr))
    }, //可能还有很多指令 
    updater: {
        //文本更新  <span>{{a}} {{b}}</span> => <span>100 200</span>
        textUpdater(node, value) {
            node.nodeValue = value
        },
        //输入框更新
        modelUpdater(node, value) {
            node.value = value
        }
    }
}