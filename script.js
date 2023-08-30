// Contentful's Content Delivery API (CDA) is a read-only API for retrieving content from Contentful. All content, both JSON and binary, is fetched from the server closest to a user's location by using our global CDN.

// Setting up the client
// In a web browser, there are multiple ways you can get the client library. The quickest way is to use the pre-built and minified JavaScript file from a CDN (already linked to script in index.html)

const client = contentful.createClient({
    space: 'p3y5xrw0wmri',
    accessToken: 'BMyc8JcH89t6f1C7raXcxRN7_3E5XngiG9aDmSXXti4',
});

const cartBtn = document.querySelector('.cart-btn')
const closeCartBtn = document.querySelector('.close-cart')
const clearCartBtn = document.querySelector('.clear-cart')
const cartDOM = document.querySelector('.cart')
const cartOverlay = document.querySelector('.cart-overlay')
const cartItems = document.querySelector('.cart-items')
const cartTotal = document.querySelector('.cart-total')
const cartContent = document.querySelector('.cart-content')
const productsDOM = document.querySelector('.products-center')


let cart = []
let buttonsDOM = []


document.addEventListener('DOMContentLoaded', () => {
    async function getProducts() {
        try {
            let contentful = await client.getEntries({
                content_type: "ecommStore"
            })

            let products = contentful.items

            products = products.map(item => {
                const { title, price } = item.fields
                const { id } = item.sys
                const image = item.fields.image.fields.file.url
                return { title, price, id, image }
            })

            let result = ''
            products.forEach(product => {
                result += `
                    <article class="product">
                        <div class="img-container">
                            <img class="product-img" src="${product.image}" alt="product">
                            <button class="bag-btn" data-id=${product.id}>
                                <i class="fa-solid fa-cart-shopping"></i>
                                Add to cart
                            </button>
                        </div>
                        <h3>${product.title}</h3>
                        <h4>$${product.price}</h4>
                    </article>
                `
            });
            productsDOM.innerHTML = result

            // ---------------------------------------
            // Local storage
            function saveData() {
                localStorage.setItem('data', JSON.stringify(products))
            }
            saveData()

            function getProduct(id) {
                let products = JSON.parse(localStorage.getItem('data'))
                return products.find(product => product.id === id)
            }

            function saveCart(cart) {
                localStorage.setItem('cart', JSON.stringify(cart))
            }

            function getCart() {
                return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : []
            }
            getCart()

            // ---------------------------------------

            // Get cart buttons
            const buttons = [...document.querySelectorAll('.bag-btn')];
            buttonsDOM = buttons
            buttons.forEach(button => {
                let id = button.dataset.id
                let inCart = cart.find(item => item.id === id)
                if (inCart) {
                    button.innerText = "In cart"
                    button.disabled = true
                }

                button.addEventListener('click', (e) => {
                    e.target.innerText = "In cart"
                    e.target.disabled = true
                    // get product from products
                    let cartItem = { ...getProduct(id), amount: 1 }
                    // add product to the cart
                    cart = [...cart, cartItem]
                    // save cart in local storage
                    saveCart(cart)
                    // set cart values 
                    setCartValues(cart)
                    // display cart item
                    addCartItem(cartItem)
                    // show the cart
                })
            })


            // Set cart values
            function setCartValues(cart) {
                let tempTotal = 0
                let itemsTotal = 0
                cart.map(item => {
                    tempTotal += item.price * item.amount
                    itemsTotal += item.amount
                })

                cartTotal.innerText = parseFloat(tempTotal.toFixed(2))
                cartItems.innerText = itemsTotal
            }

            // Add cart items
            function addCartItem(item) {
                const div = document.createElement('div')
                div.classList.add('cart-item')
                div.innerHTML = `
                        <img src=${item.image} alt="product">
                        <div>
                            <h4>${item.title}</h4>
                            <h5>$${item.price}</h5>
                            <span class="remove-item" data-id=${item.id}>remove</span>
                        </div>
                        <div>
                            <i class="fa-solid fa-chevron-up" data-id=${item.id}></i>
                            <p class="item-amount">${item.amount}</p>
                            <i class="fa-solid fa-chevron-down" data-id=${item.id}></i>
                        </div>
                    `
                cartContent.appendChild(div)
            }

            // Set up application
            function setupApp() {
                cart = getCart()
                setCartValues(cart)
                fillCart(cart)
                cartBtn.addEventListener('click', showCart)
                closeCartBtn.addEventListener('click', hideCart)
            }
            setupApp()

            // Fill up the cart
            function fillCart(cart) {
                cart.forEach(item => addCartItem(item))
            }

            // Hide cart
            function hideCart() {
                cartOverlay.classList.remove('transparentBcg')
                cartDOM.classList.remove('showCart')
            }

            // Cart logic
            function cartLogic() {
                clearCartBtn.addEventListener('click', () => {
                    clearCart()
                })

                // cart functionality
                cartContent.addEventListener('click', (e) => {
                    if (e.target.classList.contains('remove-item')) {
                        let removeItem = e.target
                        let id = removeItem.dataset.id
                        cartContent.removeChild(removeItem.parentElement.parentElement)
                        removeItem(id)
                    } else if (e.target.classList.contains('fa-chevron-up')) {
                        let addAmount = e.target
                        let id = addAmount.dataset.id
                        let tempItem = cart.find(item => item.id === id)
                        tempItem.amount = tempItem.amount + 1
                        saveCart(cart)
                        setCartValues(cart)
                        addAmount.nextElementSibling.innerText = tempItem.amount
                    } else if (e.target.classList.contains('fa-chevron-down')) {
                        let lowerAmount = e.target
                        let id = lowerAmount.dataset.id
                        let tempItem = cart.find(item => item.id === id)
                        tempItem.amount = tempItem.amount - 1

                        // the moment you hit zero (0), remove item from cart
                        if (tempItem.amount > 0) {
                            saveCart(cart)
                            setCartValues(cart)
                            lowerAmount.previousElementSibling.innerText = tempItem.amount
                        } else {
                            cartContent.removeChild(lowerAmount.parentElement.parentElement)
                            removeItem(id)
                        }
                    }
                })
            }
            cartLogic()

            function clearCart() {
                let cartItems = cart.map(item => item.id)
                cartItems.forEach(id => removeItem(id))
                while (cartContent.children.length > 0) {
                    cartContent.removeChild(cartContent.children[0])
                }
                hideCart()
            }

            function removeItem(id) {
                cart = cart.filter(item => item.id !== id)
                setCartValues(cart)
                saveCart(cart)
                let button = getSingleButton(id)
                button.disabled = false
                button.innerHTML = `
                        <i class='fa-solid fa-cart-shopping'></i>add to cart
                    `
            }

            function getSingleButton(id) {
                return buttonsDOM.find(button => button.dataset.id === id)
            }

        } catch (error) {
            console.log(error);
        }
    }
    getProducts()
})

// Show cart
function showCart() {
    cartOverlay.classList.add('transparentBcg')
    cartDOM.classList.add('showCart')
}





