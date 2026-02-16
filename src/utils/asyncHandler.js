// Promise Syntax

const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}

export { asyncHandler }

// try - catch 

/*
const asyncHandler = (requestHandler) => 
    async (req, res, next) => {
        try {
            await requestHandler(req, res, next);
        } catch (error) {
            res.status(error.code || 500).json({
                success: false,
                message: error.message
            })
        }
    }

    */
