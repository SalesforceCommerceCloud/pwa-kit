import type {ReactElement} from 'react'
import {Link} from 'react-router'
import {Button} from '@/components/ui/button'

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
                        <Button asChild className="text-xl p-6">
                            <Link to="/contact">Contact Us</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
