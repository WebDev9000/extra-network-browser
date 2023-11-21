import { useState, useEffect, useRef } from 'react'
import { debounce } from 'lodash'
import axios from 'axios'
import ReactModal from 'react-modal'
import Image from "./Image"

export default function GetImages() {
	const [images, setImages] = useState([])
	const [searchTerm, setSearchTerm] = useState('')
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)
	const [sort, setSort] = useState('modified')
	const [type, setType] = useState('lora')

	const [modalIsOpen, setIsOpen] = useState(false)
	const [moreImages, setMoreImages] = useState([])
	const [moreLoading, setMoreLoading] = useState(true)
	const [moreError, setMoreError] = useState(false)
	const [moreIndex, setMoreIndex] = useState(null)

	const inputReference = useRef(null)

	ReactModal.setAppElement('#root')

	const customModalStyle = {
		overlay: {
			backgroundColor: 'rgba(0,0,0,0.97)',
		},
		content: {
			maxWidth: '2545px',
			top: '50%',
			left: '50%',
			right: 'auto',
			bottom: 'auto',
			marginRight: '-50%',
			transform: 'translate(-50%, -50%)',
			backgroundColor: 'rgba(0,0,0,0.25)',
			border: 'none',
		},
	}

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

	const openModal = () => {
		setIsOpen(true)
	}

	const closeModal = () => {
		setIsOpen(false)
	}

	const handleFolderClick = (index) => {
		if (moreIndex == index) {
			openModal()
		} else {
			setMoreLoading(true)
			openModal()
			setMoreIndex(index)
		}
	}

	const handleModalKeys = (event) => {
		if (event.key == "ArrowLeft") {
			if (moreIndex > 0) {
				setMoreLoading(true)
				setMoreIndex(moreIndex - 1)
			}
		}
		if (event.key == "ArrowRight") {
			if (moreIndex+1 < images.length) {
				setMoreLoading(true)
				setMoreIndex(moreIndex + 1)
			}
		}
	}

	useEffect(() => {
		const fetchImages = () => {
			setLoading(true)
			setMoreLoading(true)
			setImages([])
			setMoreImages([])
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

	useEffect(() => {
		const fetchMoreImages = () => {
			setMoreLoading(true)
			setMoreImages([])

			const image = images[moreIndex]
			const query = encodeURIComponent(image.path + image.filename)

			axios.get(`http://localhost:3000/moreImages?search=${query}`)
				.then(response => {
					setMoreLoading(false)
					setMoreError(false)
					if (sort != "name") {
						setMoreImages(sortImages(response.data))
					} else {
						setMoreImages(response.data)
					}
					openModal()
				})
				.catch(err => {
					console.log(err)
					setMoreLoading(false)
					setMoreError(true)
				})
		}

		if (moreIndex != null) {
			fetchMoreImages()
		}
	}, [moreIndex])

	return (
		<>
			<div>
				<div id="search">
				<div id="typeOptions">
						<span title="Lora" className="typeOption" onClick={() => handleTypeChange("lora")}>L</span>
						<span title="Style" className="typeOption" onClick={() => handleTypeChange("styles")}>S</span>
						<span title="Embedding" className="typeOption" onClick={() => handleTypeChange("embeddings")}>E</span>
						<span title="HyperNetwork" className="typeOption" onClick={() => handleTypeChange("hypernets")}>H</span>
						<span title="Checkpoint" className="typeOption" onClick={() => handleTypeChange("checkpoints")}>C</span>
					</div>
					<input id="imgSearch" icon='search' placeholder='Search...'
						onChange={handleSearchInputChange}
					/>
					<div id="sortOptions">
						<span title="Modified" className="sortOption" onClick={() => handleSortChange("modified")}>M</span>
						<span title="Name" className="sortOption" onClick={() => handleSortChange("name")}>N</span>
					</div>
				</div>
				<div>
					{loading && <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>}
					{error && <h2>There was an error loading the images.</h2>}
					{!loading && !error && images.map((image, index) => (
						<Image key={index} index={index} {...image} onFolderClick={handleFolderClick} />
					))}
				</div>
				<ReactModal
					isOpen={modalIsOpen}
					onAfterOpen={() => { inputReference.current.focus() }}
					onRequestClose={closeModal}
					preventScroll={true}
					style={customModalStyle}
				>
					<div
						ref={inputReference}
						tabIndex="-1" // Enables key handlers on div
						onKeyDown={handleModalKeys}
						className="modalContent"
					>
						{moreLoading && <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>}
						{moreError && <h2>There was an error loading the images.</h2>}
						{!moreLoading && !moreError && <div className="modalHeader" style={{width: `calc(224px * ${moreImages.length})`}}>{images[moreIndex].path + images[moreIndex].filename}</div>}
						{!moreLoading && !moreError && moreImages.map((image, index) => (
							<div key={index+1000000} className="imgCard" onClick={() => {navigator.clipboard.writeText(images[moreIndex].prompt)}}>
								<img width="224" height="336"
									src={"http://localhost:3000/" + image.path + encodeURIComponent(image.filename)}
									loading={index <= 60 ? "eager" : "lazy"}
									title={image.filename}
								/>
							</div>
						))}
					</div>
				</ReactModal>
			</div>
		</>
	)
}