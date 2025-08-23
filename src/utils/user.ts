function getLoggedInUser() {
    return JSON.parse(localStorage.getItem('user'))
}

export default getLoggedInUser