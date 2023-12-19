type Dependency<T> = () => T

type Container = {
    register: <T>(name: string, dependency: Dependency<T>, isSingleton?: boolean) => void
    resolve: <T>(name: string) => T
    reset: () => void
    remove: (name: string) => void
}

const createContainer = (): Container => {
    const dependencies: Record<string, Dependency<any>> = {}
    const singletons: Record<string, any> = {}

    const register = <T>(name: string, dependency: Dependency<T>, isSingleton: boolean = false) => {
        if (singletons[name]) {
            return
        }

        if (isSingleton) {
            if (!singletons[name]) {
                singletons[name] = dependency()
            }

            dependencies[name] = () => singletons[name]
            return
        }

        dependencies[name] = dependency
    }

    const resolve = <T>(name: string): T => {
        if (!dependencies[name]) {
            throw new Error(`Dependency ${name} not found`)
        }

        return dependencies[name]() as T
    }

    const reset = () => {
        Object.keys(singletons).forEach((key) => {
            delete singletons[key]
        })

        Object.keys(dependencies).forEach((key) => {
            delete dependencies[key]
        })
    }

    const remove = (name: string) => {
        if (dependencies[name]) {
            delete dependencies[name]
        }
        if (singletons[name]) {
            delete singletons[name]
        }
    }

    return {
        register,
        resolve,
        reset,
        remove,
    }
}

export default createContainer


