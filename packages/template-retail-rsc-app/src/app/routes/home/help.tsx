import type {ReactElement} from 'react'
import {Link} from 'react-router'

export default function Help(): ReactElement {
    return (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:flex lg:items-center lg:justify-between">
                <div className="lg:max-w-lg">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        We're here to help
                    </h2>
                    <p className="mt-4 text-lg text-gray-500">
                        Contact our support staff.
                        <br />
                        They will get you to the right place.
                    </p>
                    <div className="mt-8">
                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
