import { useState, useEffect } from 'react'
import axios from 'axios'
import { debounce } from 'lodash'
import Image from "./Image"

export default function GetImages() {
	const [images, setImages] = useState([])
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [sort, setSort] = useState('modified')
	const [type, setType] = useState('lora')

	const sortImages = (dataArray) => {
		dataArray.sort(function(a, b){
			if (sort == "modified") {
				return b.mtimeMs - a.mtimeMs
			} else {
				return a.filename - b.filename
			}
		})
		return dataArray
	}

	const handleSearchInputChange = debounce((e) => {
		setSearchTerm(e.target.value)
	}, 500)

	const handleSortChange = (sortOption) => {
		setSort(sortOption)
	}

	const handleTypeChange = (typeOption) => {
		setType(typeOption)
	}

	useEffect(() => {
		const fetchImages = () => {
			setImages([])
			setLoading(true)
			axios.get(`http://localhost:3000/images?type=${type}&search=${searchTerm}`)
				.then(response => {
					if (sort != "name") {
						setImages(sortImages(response.data))
					} else {
						setImages(response.data)
					}
					setLoading(false)
					setError(false)
				})
				.catch(err => {
					console.log(err)
					setLoading(false)
					setError(true)
				})
    }

		fetchImages()
	}, [searchTerm, sort, type])

	return (
		<>
			<div>
				<div id="search">
				<div id="typeOptions">
						<span className="typeOption" onClick={() => handleTypeChange("lora")}>L</span>
						<span className="typeOption" onClick={() => handleTypeChange("styles")}>S</span>
						<span className="typeOption" onClick={() => handleTypeChange("embeddings")}>E</span>
						<span className="typeOption" onClick={() => handleTypeChange("hypernets")}>H</span>
						<span className="typeOption" onClick={() => handleTypeChange("checkpoints")}>C</span>
					</div>
					<input id="imgSearch" icon='search' placeholder='Search...'
						onChange={handleSearchInputChange}
					/>
					<div id="sortOptions">
						<span className="sortOption" onClick={() => handleSortChange("modified")}>M</span>
						<span className="sortOption" onClick={() => handleSortChange("name")}>N</span>
					</div>
				</div>
				<div>
					{loading && <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>}
					{error && <h2>There was an error loading the images.</h2>}
					{!loading && !error && images.map((image, index) => (
						<Image key={index} index={index} {...image} />
					))}
				</div>
			</div>
		</>
	)
}