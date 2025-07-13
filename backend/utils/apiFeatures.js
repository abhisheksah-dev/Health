class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }

    search() {
        if (this.queryString.search) {
            const searchFields = this.queryString.searchFields ? 
                this.queryString.searchFields.split(',') : 
                ['name', 'description'];

            const searchQuery = searchFields.map(field => ({
                [field]: { $regex: this.queryString.search, $options: 'i' }
            }));

            this.query = this.query.find({ $or: searchQuery });
        }

        return this;
    }

    geoNear() {
        if (this.queryString.near && this.queryString.coordinates) {
            const [longitude, latitude] = this.queryString.coordinates.split(',');
            const maxDistance = this.queryString.maxDistance || 10000; // Default 10km

            this.query = this.query.find({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(longitude), parseFloat(latitude)]
                        },
                        $maxDistance: parseInt(maxDistance)
                    }
                }
            });
        }

        return this;
    }
}

module.exports = APIFeatures;