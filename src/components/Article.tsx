import * as React from 'react'

export default function () {
    const articles = [
        { title: 'Title Article', createdAt: '23 January 2023 8.20 PM' },
        { title: 'Title Article', createdAt: '23 January 2023 8.20 PM' },
        { title: 'Title Article', createdAt: '23 January 2023 8.20 PM' },
    ]

    return <div className='m-2 article rounded p-2 flex flex-col justify-between'>
        <div className='flex justify-end'>
            <p className="text-xs">Hide</p>
        </div>
        {articles.map((article, i) => <div key={`article_${i}`} className='px-2'>
            <p className="text-base text-primary">{article.title}</p>
            <p className="text-xs text-secondary">{article.createdAt}</p>
        </div>)}
        <div className='flex justify-end'>
            <p className="text-xs">Show more</p>
        </div>
    </div>
}